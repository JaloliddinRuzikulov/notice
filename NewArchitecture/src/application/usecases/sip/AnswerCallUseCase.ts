/**
 * Answer Call Use Case
 * Handles answering incoming SIP calls
 */

import { injectable, inject } from 'tsyringe';
import { IUseCase, UseCaseResult, createSuccessResult, createErrorResult } from '../base/IUseCase';
import { ISipService } from '@/infrastructure/services/SipService';
import { ICallRepository } from '@/core/domain/repositories/ICallRepository';
import { IWebSocketService } from '@/infrastructure/services/WebSocketService';
import { Call, CallStatus } from '@/core/domain/entities/Call';

export interface AnswerCallRequest {
  callId: string;
  answeredBy?: string;
}

export interface AnswerCallResponse {
  call: Call;
  answerTime: Date;
}

@injectable()
export class AnswerCallUseCase implements IUseCase<AnswerCallRequest, UseCaseResult<AnswerCallResponse>> {
  constructor(
    @inject('ISipService') private sipService: ISipService,
    @inject('ICallRepository') private callRepository: ICallRepository,
    @inject('IWebSocketService') private wsService: IWebSocketService
  ) {}

  async execute(request: AnswerCallRequest): Promise<UseCaseResult<AnswerCallResponse>> {
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
      if (callObj.status !== CallStatus.RINGING) {
        return createErrorResult(`Cannot answer call in ${callObj.status} state`);
      }

      // 4. Answer call via SIP service
      await this.sipService.answerCall(request.callId);

      // 5. Update call record
      callRecord.answer();
      if (request.answeredBy) {
        callRecord.updateMetadata('answeredBy', request.answeredBy);
      }

      const updatedCall = await this.callRepository.update(callObj.id!, callRecord);

      // 6. Broadcast status update
      this.wsService.broadcastCallStatus(request.callId, CallStatus.ANSWERED, {
        answerTime: callRecord.answerTime,
        waitTime: callRecord.getWaitTime(),
        answeredBy: request.answeredBy
      });

      return createSuccessResult({
        call: updatedCall,
        answerTime: callRecord.answerTime!
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      this.wsService.broadcastSystemNotification('call-error', `Failed to answer call: ${errorMessage}`, {
        callId: request.callId,
        error: errorMessage
      });

      return createErrorResult(`Failed to answer call: ${errorMessage}`);
    }
  }
}