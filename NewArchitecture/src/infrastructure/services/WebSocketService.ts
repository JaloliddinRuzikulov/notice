/**
 * WebSocket Service Implementation
 * Handles real-time communication using Socket.io
 */

import { EventEmitter } from 'events';
import { injectable } from 'tsyringe';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server } from 'http';
import { CallStatus } from '@/core/domain/entities/Call';
import { BroadcastStatus } from '@/core/domain/entities/Broadcast';

export interface IWebSocketService {
  initialize(httpServer: Server): void;
  broadcastCallStatus(callId: string, status: CallStatus, data?: any): void;
  broadcastBroadcastStatus(broadcastId: string, status: BroadcastStatus, data?: any): void;
  broadcastSystemNotification(type: string, message: string, data?: any): void;
  emitToRoom(room: string, event: string, data: any): void;
  emitToUser(userId: string, event: string, data: any): void;
  joinRoom(socketId: string, room: string): void;
  leaveRoom(socketId: string, room: string): void;
  getConnectedUsers(): number;
  on(event: string, callback: Function): void;
}

@injectable()
export class WebSocketService extends EventEmitter implements IWebSocketService {
  private io: SocketIOServer | null = null;
  private connectedSockets: Map<string, Socket> = new Map();
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId

  constructor() {
    super();
  }

  initialize(httpServer: Server): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupEventHandlers();
    this.emit('initialized');
  }

  broadcastCallStatus(callId: string, status: CallStatus, data?: any): void {
    if (!this.io) return;

    const payload = {
      callId,
      status,
      timestamp: new Date(),
      ...data
    };

    this.io.emit('call-status-update', payload);
    this.emit('callStatusBroadcast', payload);
  }

  broadcastBroadcastStatus(broadcastId: string, status: BroadcastStatus, data?: any): void {
    if (!this.io) return;

    const payload = {
      broadcastId,
      status,
      timestamp: new Date(),
      ...data
    };

    this.io.emit('broadcast-status-update', payload);
    this.emit('broadcastStatusBroadcast', payload);
  }

  broadcastSystemNotification(type: string, message: string, data?: any): void {
    if (!this.io) return;

    const payload = {
      type,
      message,
      timestamp: new Date(),
      ...data
    };

    this.io.emit('system-notification', payload);
    this.emit('systemNotificationBroadcast', payload);
  }

  emitToRoom(room: string, event: string, data: any): void {
    if (!this.io) return;
    
    this.io.to(room).emit(event, {
      ...data,
      timestamp: new Date()
    });
  }

  emitToUser(userId: string, event: string, data: any): void {
    if (!this.io) return;

    const socketIds = this.userSockets.get(userId);
    if (socketIds) {
      socketIds.forEach(socketId => {
        const socket = this.connectedSockets.get(socketId);
        if (socket) {
          socket.emit(event, {
            ...data,
            timestamp: new Date()
          });
        }
      });
    }
  }

  joinRoom(socketId: string, room: string): void {
    const socket = this.connectedSockets.get(socketId);
    if (socket) {
      socket.join(room);
      this.emit('userJoinedRoom', { socketId, room });
    }
  }

  leaveRoom(socketId: string, room: string): void {
    const socket = this.connectedSockets.get(socketId);
    if (socket) {
      socket.leave(room);
      this.emit('userLeftRoom', { socketId, room });
    }
  }

  getConnectedUsers(): number {
    return this.userSockets.size;
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      console.log(`Socket connected: ${socket.id}`);
      this.connectedSockets.set(socket.id, socket);
      
      // Handle user authentication
      socket.on('authenticate', (data: { userId: string, token?: string }) => {
        this.handleUserAuthentication(socket, data);
      });

      // Handle joining rooms
      socket.on('join-room', (room: string) => {
        socket.join(room);
        this.emit('userJoinedRoom', { socketId: socket.id, room });
      });

      // Handle leaving rooms
      socket.on('leave-room', (room: string) => {
        socket.leave(room);
        this.emit('userLeftRoom', { socketId: socket.id, room });
      });

      // Handle call events
      socket.on('call-status-update', (data: any) => {
        this.handleCallStatusUpdate(socket, data);
      });

      // Handle DTMF input
      socket.on('dtmf-input', (data: { callId: string, dtmf: string }) => {
        this.handleDTMFInput(socket, data);
      });

      // Handle broadcast events
      socket.on('broadcast-update', (data: any) => {
        this.handleBroadcastUpdate(socket, data);
      });

      // Handle SIP phone events
      socket.on('sip-phone-event', (data: any) => {
        this.handleSipPhoneEvent(socket, data);
      });

      // Handle audio events
      socket.on('audio-event', (data: any) => {
        this.handleAudioEvent(socket, data);
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date() });
      });

      // Handle disconnection
      socket.on('disconnect', (reason: string) => {
        this.handleDisconnection(socket, reason);
      });

      // Handle errors
      socket.on('error', (error: any) => {
        console.error(`Socket error for ${socket.id}:`, error);
        this.emit('socketError', { socketId: socket.id, error });
      });

      this.emit('clientConnected', { socketId: socket.id });
    });

    this.io.on('error', (error: any) => {
      console.error('Socket.io error:', error);
      this.emit('serverError', { error });
    });
  }

  private handleUserAuthentication(socket: Socket, data: { userId: string, token?: string }): void {
    try {
      // TODO: Implement token validation if needed
      const { userId } = data;
      
      // Map socket to user
      this.socketUsers.set(socket.id, userId);
      
      // Add socket to user's socket list
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)!.push(socket.id);

      // Join user-specific room
      socket.join(`user:${userId}`);

      socket.emit('authenticated', { 
        success: true, 
        userId,
        socketId: socket.id
      });

      this.emit('userAuthenticated', { socketId: socket.id, userId });

    } catch (error) {
      socket.emit('authentication-failed', { 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      });
    }
  }

  private handleCallStatusUpdate(socket: Socket, data: any): void {
    const userId = this.socketUsers.get(socket.id);
    if (!userId) return;

    // Broadcast to all connected users
    this.broadcastCallStatus(data.callId, data.status, {
      ...data,
      updatedBy: userId
    });
  }

  private handleDTMFInput(socket: Socket, data: { callId: string, dtmf: string }): void {
    const userId = this.socketUsers.get(socket.id);
    if (!userId) return;

    // Broadcast DTMF input to interested parties
    this.io?.emit('dtmf-received', {
      ...data,
      userId,
      timestamp: new Date()
    });

    this.emit('dtmfReceived', { ...data, userId });
  }

  private handleBroadcastUpdate(socket: Socket, data: any): void {
    const userId = this.socketUsers.get(socket.id);
    if (!userId) return;

    this.broadcastBroadcastStatus(data.broadcastId, data.status, {
      ...data,
      updatedBy: userId
    });
  }

  private handleSipPhoneEvent(socket: Socket, data: any): void {
    const userId = this.socketUsers.get(socket.id);
    if (!userId) return;

    // Emit to specific user or broadcast based on event type
    if (data.target === 'user') {
      this.emitToUser(data.targetUserId, 'sip-phone-event', {
        ...data,
        fromUser: userId
      });
    } else {
      this.io?.emit('sip-phone-event', {
        ...data,
        fromUser: userId,
        timestamp: new Date()
      });
    }
  }

  private handleAudioEvent(socket: Socket, data: any): void {
    const userId = this.socketUsers.get(socket.id);
    if (!userId) return;

    // Broadcast audio events (like recording start/stop)
    this.io?.emit('audio-event', {
      ...data,
      userId,
      timestamp: new Date()
    });

    this.emit('audioEvent', { ...data, userId });
  }

  private handleDisconnection(socket: Socket, reason: string): void {
    console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    
    const userId = this.socketUsers.get(socket.id);
    
    // Clean up user mappings
    if (userId) {
      const userSocketIds = this.userSockets.get(userId);
      if (userSocketIds) {
        const index = userSocketIds.indexOf(socket.id);
        if (index > -1) {
          userSocketIds.splice(index, 1);
        }
        
        // If no more sockets for this user, remove the user entry
        if (userSocketIds.length === 0) {
          this.userSockets.delete(userId);
        }
      }
      
      this.socketUsers.delete(socket.id);
    }
    
    // Remove from connected sockets
    this.connectedSockets.delete(socket.id);
    
    this.emit('clientDisconnected', { 
      socketId: socket.id, 
      userId, 
      reason 
    });
  }

  // Get server statistics
  getServerStats(): any {
    return {
      connectedSockets: this.connectedSockets.size,
      authenticatedUsers: this.userSockets.size,
      rooms: this.io?.sockets.adapter.rooms.size || 0,
      uptime: process.uptime()
    };
  }
}