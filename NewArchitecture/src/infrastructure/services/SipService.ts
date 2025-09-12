/**
 * SIP Service Implementation
 * Handles SIP protocol communication for calls
 */

import { EventEmitter } from 'events';
import { injectable } from 'tsyringe';
import * as JsSIP from 'jssip';
import { Call, CallStatus, CallDirection, CallType } from '@/core/domain/entities/Call';

export interface SipAccount {
  uri: string;
  password: string;
  displayName: string;
  registrar: string;
  wsServers: string[];
}

export interface ISipService {
  connect(account: SipAccount): Promise<void>;
  disconnect(): Promise<void>;
  makeCall(number: string): Promise<Call>;
  hangupCall(callId: string): Promise<void>;
  answerCall(callId: string): Promise<void>;
  transferCall(callId: string, targetNumber: string): Promise<void>;
  holdCall(callId: string): Promise<void>;
  resumeCall(callId: string): Promise<void>;
  sendDTMF(callId: string, dtmf: string): Promise<void>;
  getActiveCall(): Call | null;
  isConnected(): boolean;
  on(event: string, callback: Function): void;
}

@injectable()
export class SipService extends EventEmitter implements ISipService {
  private ua: JsSIP.UA | null = null;
  private currentCall: Call | null = null;
  private activeSessions: Map<string, any> = new Map();
  private isRegistered: boolean = false;

  constructor() {
    super();
  }

  async connect(account: SipAccount): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const socket = new JsSIP.WebSocketInterface(account.wsServers[0]);
        
        const configuration: any = {
          sockets: [socket],
          uri: account.uri,
          password: account.password,
          display_name: account.displayName,
          registrar_server: account.registrar,
          contact_uri: account.uri,
          authorization_user: account.uri.split('@')[0].replace('sip:', ''),
          instance_id: this.generateInstanceId(),
          session_timers: false,
          use_preloaded_route: false
        };

        this.ua = new JsSIP.UA(configuration);
        this.setupEventListeners();

        this.ua.on('registered', () => {
          this.isRegistered = true;
          this.emit('registered');
          resolve();
        });

        this.ua.on('registrationFailed', (data: any) => {
          this.isRegistered = false;
          this.emit('registrationFailed', data);
          reject(new Error(`Registration failed: ${data.cause}`));
        });

        this.ua.start();

      } catch (error) {
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.ua) {
      this.ua.stop();
      this.ua = null;
      this.isRegistered = false;
      this.currentCall = null;
      this.activeSessions.clear();
      this.emit('disconnected');
    }
  }

  async makeCall(number: string): Promise<Call> {
    return new Promise((resolve, reject) => {
      if (!this.ua || !this.isRegistered) {
        reject(new Error('SIP service not registered'));
        return;
      }

      const callId = this.generateCallId();
      const call = Call.create({
        callId: callId,
        from: (this.ua as any).configuration?.uri || 'sip:user@domain.com',
        to: number,
        direction: CallDirection.OUTBOUND,
        type: CallType.DIRECT,
        status: CallStatus.INITIATED,
        startTime: new Date()
      });

      const eventHandlers = {
        progress: (data: any) => {
          call.ring();
          this.emit('callProgress', { callId, data });
        },
        failed: (data: any) => {
          call.fail(data.cause);
          this.activeSessions.delete(callId);
          this.emit('callFailed', { callId, cause: data.cause });
        },
        ended: (data: any) => {
          call.complete();
          this.activeSessions.delete(callId);
          if (this.currentCall?.callId === callId) {
            this.currentCall = null;
          }
          this.emit('callEnded', { callId, data });
        },
        confirmed: (data: any) => {
          call.answer();
          this.currentCall = call;
          this.emit('callAnswered', { callId, data });
        }
      };

      const options = {
        eventHandlers,
        mediaConstraints: {
          audio: true,
          video: false
        },
        rtcConstraints: {
          offerToReceiveAudio: 1,
          offerToReceiveVideo: 0
        }
      };

      try {
        const session = this.ua.call(`sip:${number}@domain.com`, options);
        this.activeSessions.set(callId, session);
        
        resolve(call);
      } catch (error) {
        call.fail(error instanceof Error ? error.message : 'Unknown error');
        reject(error);
      }
    });
  }

  async hangupCall(callId: string): Promise<void> {
    const session = this.activeSessions.get(callId);
    if (session) {
      session.terminate();
      this.activeSessions.delete(callId);
      
      if (this.currentCall?.callId === callId) {
        this.currentCall.cancel();
        this.currentCall = null;
      }
    }
  }

  async answerCall(callId: string): Promise<void> {
    const session = this.activeSessions.get(callId);
    if (session && session.direction === 'incoming') {
      const options = {
        mediaConstraints: {
          audio: true,
          video: false
        }
      };
      session.answer(options);
    }
  }

  async transferCall(callId: string, targetNumber: string): Promise<void> {
    const session = this.activeSessions.get(callId);
    if (session) {
      session.refer(`sip:${targetNumber}@domain.com`);
    }
  }

  async holdCall(callId: string): Promise<void> {
    const session = this.activeSessions.get(callId);
    if (session) {
      session.hold();
      this.emit('callHeld', { callId });
    }
  }

  async resumeCall(callId: string): Promise<void> {
    const session = this.activeSessions.get(callId);
    if (session) {
      session.unhold();
      this.emit('callResumed', { callId });
    }
  }

  async sendDTMF(callId: string, dtmf: string): Promise<void> {
    const session = this.activeSessions.get(callId);
    if (session) {
      session.sendDTMF(dtmf);
      
      if (this.currentCall?.callId === callId) {
        this.currentCall.addDtmfInput(dtmf);
      }
      
      this.emit('dtmfSent', { callId, dtmf });
    }
  }

  getActiveCall(): Call | null {
    return this.currentCall;
  }

  isConnected(): boolean {
    return this.isRegistered;
  }

  private setupEventListeners(): void {
    if (!this.ua) return;

    this.ua.on('newRTCSession', (data: any) => {
      const session = data.session;
      const callId = this.generateCallId();
      
      if (session.direction === 'incoming') {
        const call = Call.create({
          callId: callId,
          from: session.remote_identity.uri.toString(),
          to: 'sip:user@domain.com',
          direction: CallDirection.INBOUND,
          type: CallType.DIRECT,
          status: CallStatus.RINGING,
          startTime: new Date()
        });

        this.activeSessions.set(callId, session);
        this.emit('incomingCall', { call, session });

        session.on('ended', () => {
          call.complete();
          this.activeSessions.delete(callId);
          if (this.currentCall?.callId === callId) {
            this.currentCall = null;
          }
          this.emit('callEnded', { callId });
        });

        session.on('failed', (data: any) => {
          call.fail(data.cause);
          this.activeSessions.delete(callId);
          this.emit('callFailed', { callId, cause: data.cause });
        });
      }
    });

    this.ua.on('registered', () => {
      this.emit('sipRegistered');
    });

    this.ua.on('unregistered', () => {
      this.emit('sipUnregistered');
    });

    this.ua.on('registrationFailed', (data: any) => {
      this.emit('sipRegistrationFailed', data);
    });

    this.ua.on('disconnected', () => {
      this.isRegistered = false;
      this.emit('sipDisconnected');
    });
  }

  private generateCallId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateInstanceId(): string {
    return `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}