/**
 * Hangup Call Use Case
 * Handles ending/terminating SIP calls
 */

import { injectable, inject } from 'tsyringe';
import { IUseCase, UseCaseResult, createSuccessResult, createErrorResult } from '../base/IUseCase';
import { ISipService } from '@/infrastructure/services/SipService';
import { ICallRepository } from '@/core/domain/repositories/ICallRepository';
import { IWebSocketService } from '@/infrastructure/services/WebSocketService';
import { Call, CallStatus } from '@/core/domain/entities/Call';

export interface HangupCallRequest {
  callId: string;
  reason?: string;
  endedBy?: string;
}

export interface HangupCallResponse {
  call: Call;
  endTime: Date;
  duration?: number;
  finalStatus: CallStatus;
}

@injectable()
export class HangupCallUseCase implements IUseCase<HangupCallRequest, UseCaseResult<HangupCallResponse>> {
  constructor(
    @inject('ISipService') private sipService: ISipService,
    @inject('ICallRepository') private callRepository: ICallRepository,
    @inject('IWebSocketService') private wsService: IWebSocketService
  ) {}

  async execute(request: HangupCallRequest): Promise<UseCaseResult<HangupCallResponse>> {
    try {
      // 1. Validate request
      if (!request.callId?.trim()) {
        return createErrorResult('Call ID is required');
      }

      // 2. Find call in database
      const calls = await this.callRepository.search({ callId: request.callId });
      if (!calls || calls.length === 0) {
        return createErrorResult('Call not found');
      }

      const callRecord = calls[0];
      const callObj = callRecord.toObject();

      // 3. Validate call state
      if (!callRecord.isActive() && callObj.status !== CallStatus.RINGING) {
        return createErrorResult(`Call is already ended (${callObj.status})`);
      }

      // 4. End call via SIP service
      await this.sipService.hangupCall(request.callId);

      // 5. Update call record based on current status
      let finalStatus: CallStatus;
      
      if (callObj.status === CallStatus.ANSWERED) {
        callRecord.complete();
        finalStatus = CallStatus.COMPLETED;
      } else {
        callRecord.cancel();
        finalStatus = CallStatus.CANCELLED;
      }

      // Add metadata about who ended the call
      if (request.endedBy) {
        callRecord.updateMetadata('endedBy', request.endedBy);
      }
      
      if (request.reason) {
        callRecord.updateMetadata('hangupReason', request.reason);
      }

      const updatedCall = await this.callRepository.update(callObj.id!, callRecord);
      const updatedCallObj = updatedCall.toObject();

      // 6. Broadcast status update
      this.wsService.broadcastCallStatus(request.callId, finalStatus, {
        endTime: updatedCallObj.endTime,
        duration: updatedCallObj.duration,
        formattedDuration: updatedCall.getFormattedDuration(),
        reason: request.reason,
        endedBy: request.endedBy,
        totalWaitTime: updatedCall.getWaitTime()
      });

      return createSuccessResult({
        call: updatedCall,
        endTime: updatedCallObj.endTime!,
        duration: updatedCallObj.duration,
        finalStatus
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      this.wsService.broadcastSystemNotification('call-error', `Failed to hangup call: ${errorMessage}`, {
        callId: request.callId,
        error: errorMessage
      });

      return createErrorResult(`Failed to hangup call: ${errorMessage}`);
    }
  }
}