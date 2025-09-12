/**
 * Make Call Use Case
 * Handles initiating SIP calls with proper business logic
 */

import { injectable, inject } from 'tsyringe';
import { IUseCase, UseCaseResult, createSuccessResult, createErrorResult } from '../base/IUseCase';
import { ISipService } from '@/infrastructure/services/SipService';
import { ICallRepository } from '@/core/domain/repositories/ICallRepository';
import { IEmployeeRepository } from '@/core/domain/repositories/IEmployeeRepository';
import { IWebSocketService } from '@/infrastructure/services/WebSocketService';
import { Call, CallType, CallDirection, CallStatus } from '@/core/domain/entities/Call';

export interface MakeCallRequest {
  fromNumber: string;
  toNumber: string;
  callType: CallType;
  employeeId?: string;
  broadcastId?: string;
  metadata?: Record<string, any>;
}

export interface MakeCallResponse {
  call: Call;
  sessionInfo?: any;
}

@injectable()
export class MakeCallUseCase implements IUseCase<MakeCallRequest, UseCaseResult<MakeCallResponse>> {
  constructor(
    @inject('ISipService') private sipService: ISipService,
    @inject('ICallRepository') private callRepository: ICallRepository,
    @inject('IEmployeeRepository') private employeeRepository: IEmployeeRepository,
    @inject('IWebSocketService') private wsService: IWebSocketService
  ) {}

  async execute(request: MakeCallRequest): Promise<UseCaseResult<MakeCallResponse>> {
    try {
      // 1. Validate request
      const validation = await this.validateRequest(request);
      if (!validation.isValid) {
        return createErrorResult('Validation failed', validation.errors);
      }

      // 2. Check if SIP service is connected
      if (!this.sipService.isConnected()) {
        return createErrorResult('SIP service is not connected');
      }

      // 3. Check if there's an active call (only one call at a time for now)
      const activeCall = this.sipService.getActiveCall();
      if (activeCall) {
        return createErrorResult('Another call is already active', [`Active call ID: ${activeCall.callId}`]);
      }

      // 4. Validate employee if provided
      let targetEmployee = null;
      if (request.employeeId) {
        targetEmployee = await this.employeeRepository.findById(request.employeeId);
        if (!targetEmployee) {
          return createErrorResult('Target employee not found');
        }
        
        // Use employee's phone number if different from request
        if (targetEmployee.phoneNumber && targetEmployee.phoneNumber !== request.toNumber) {
          request.toNumber = targetEmployee.phoneNumber;
        }
      }

      // 5. Initiate SIP call
      const sipCall = await this.sipService.makeCall(request.toNumber);
      
      // 6. Create call record in database
      const callRecord = Call.create({
        callId: sipCall.callId,
        from: request.fromNumber,
        to: request.toNumber,
        direction: CallDirection.OUTBOUND,
        type: request.callType,
        status: CallStatus.INITIATED,
        broadcastId: request.broadcastId,
        employeeId: request.employeeId,
        startTime: new Date(),
        metadata: {
          ...request.metadata,
          targetEmployee: targetEmployee ? {
            id: targetEmployee.toObject().id,
            fullName: targetEmployee.fullName,
            department: targetEmployee.department
          } : undefined
        }
      });

      // 7. Save call to database
      const savedCall = await this.callRepository.save(callRecord);

      // 8. Setup SIP event listeners for this call
      this.setupCallEventListeners(sipCall.callId, savedCall);

      // 9. Broadcast call status via WebSocket
      this.wsService.broadcastCallStatus(sipCall.callId, CallStatus.INITIATED, {
        fromNumber: request.fromNumber,
        toNumber: request.toNumber,
        callType: request.callType,
        employeeId: request.employeeId,
        broadcastId: request.broadcastId
      });

      return createSuccessResult({
        call: savedCall,
        sessionInfo: {
          sipCallId: sipCall.callId,
          startTime: sipCall.startTime
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Broadcast error via WebSocket
      this.wsService.broadcastSystemNotification('call-error', `Failed to make call: ${errorMessage}`, {
        fromNumber: request.fromNumber,
        toNumber: request.toNumber,
        error: errorMessage
      });

      return createErrorResult(`Failed to make call: ${errorMessage}`);
    }
  }

  private async validateRequest(request: MakeCallRequest): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate required fields
    if (!request.fromNumber?.trim()) {
      errors.push('From number is required');
    }

    if (!request.toNumber?.trim()) {
      errors.push('To number is required');
    }

    if (!request.callType) {
      errors.push('Call type is required');
    }

    // Validate phone number format (basic validation)
    if (request.fromNumber && !this.isValidPhoneNumber(request.fromNumber)) {
      errors.push('From number format is invalid');
    }

    if (request.toNumber && !this.isValidPhoneNumber(request.toNumber)) {
      errors.push('To number format is invalid');
    }

    // Validate call type
    if (request.callType && !Object.values(CallType).includes(request.callType)) {
      errors.push('Invalid call type');
    }

    // Check if calling same number
    if (request.fromNumber === request.toNumber) {
      errors.push('Cannot call same number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic phone number validation (extend as needed)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanNumber) || /^\d{3,4}$/.test(cleanNumber); // Also allow short extensions
  }

  private setupCallEventListeners(callId: string, callRecord: Call): void {
    // Listen to SIP service events for this specific call
    this.sipService.on('callProgress', (data: any) => {
      if (data.callId === callId) {
        this.handleCallProgress(callRecord, data);
      }
    });

    this.sipService.on('callAnswered', (data: any) => {
      if (data.callId === callId) {
        this.handleCallAnswered(callRecord, data);
      }
    });

    this.sipService.on('callEnded', (data: any) => {
      if (data.callId === callId) {
        this.handleCallEnded(callRecord, data);
      }
    });

    this.sipService.on('callFailed', (data: any) => {
      if (data.callId === callId) {
        this.handleCallFailed(callRecord, data);
      }
    });
  }

  private async handleCallProgress(callRecord: Call, data: any): Promise<void> {
    try {
      callRecord.ring();
      await this.callRepository.update(callRecord.toObject().id!, callRecord);
      
      this.wsService.broadcastCallStatus(callRecord.callId, CallStatus.RINGING, {
        duration: callRecord.getWaitTime(),
        ...data
      });
    } catch (error) {
      console.error('Error handling call progress:', error);
    }
  }

  private async handleCallAnswered(callRecord: Call, data: any): Promise<void> {
    try {
      callRecord.answer();
      await this.callRepository.update(callRecord.toObject().id!, callRecord);
      
      this.wsService.broadcastCallStatus(callRecord.callId, CallStatus.ANSWERED, {
        answerTime: callRecord.answerTime,
        waitTime: callRecord.getWaitTime(),
        ...data
      });
    } catch (error) {
      console.error('Error handling call answered:', error);
    }
  }

  private async handleCallEnded(callRecord: Call, data: any): Promise<void> {
    try {
      if (callRecord.status === CallStatus.ANSWERED) {
        callRecord.complete();
      } else {
        callRecord.cancel();
      }
      
      await this.callRepository.update(callRecord.toObject().id!, callRecord);
      
      this.wsService.broadcastCallStatus(callRecord.callId, callRecord.status, {
        endTime: callRecord.endTime,
        duration: callRecord.duration,
        formattedDuration: callRecord.getFormattedDuration(),
        ...data
      });
    } catch (error) {
      console.error('Error handling call ended:', error);
    }
  }

  private async handleCallFailed(callRecord: Call, data: any): Promise<void> {
    try {
      callRecord.fail(data.cause || 'Unknown failure');
      await this.callRepository.update(callRecord.toObject().id!, callRecord);
      
      this.wsService.broadcastCallStatus(callRecord.callId, CallStatus.FAILED, {
        failureReason: callRecord.failureReason,
        endTime: callRecord.endTime,
        ...data
      });
    } catch (error) {
      console.error('Error handling call failed:', error);
    }
  }
}