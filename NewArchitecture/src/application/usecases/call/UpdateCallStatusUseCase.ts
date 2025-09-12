/**
 * Update Call Status Use Case
 * Handles updating call record status and information
 */

import { injectable, inject } from 'tsyringe';
import { IUseCase, UseCaseResult, createSuccessResult, createErrorResult } from '../base/IUseCase';
import { ICallRepository } from '@/core/domain/repositories/ICallRepository';
import { Call, CallStatus } from '@/core/domain/entities/Call';

export interface UpdateCallStatusRequest {
  callId: string;
  status: CallStatus;
  endTime?: Date;
  duration?: number;
  notes?: string;
  updatedBy?: string;
}

export interface UpdateCallStatusResponse {
  call: Call;
}

@injectable()
export class UpdateCallStatusUseCase implements IUseCase<UpdateCallStatusRequest, UseCaseResult<UpdateCallStatusResponse>> {
  constructor(
    @inject('ICallRepository')
    private callRepository: ICallRepository
  ) {}

  async execute(request: UpdateCallStatusRequest): Promise<UseCaseResult<UpdateCallStatusResponse>> {
    try {
      // Validate request
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return createErrorResult('Validation failed', validation.errors);
      }

      // Check if call exists
      const existingCall = await this.callRepository.findById(request.callId);
      if (!existingCall) {
        return createErrorResult('Call record not found');
      }

      const callData = existingCall.toObject();

      // Validate status transition
      const validTransition = this.isValidStatusTransition(callData.status, request.status);
      if (!validTransition.isValid) {
        return createErrorResult(validTransition.error);
      }

      // Calculate duration if not provided but endTime is
      let duration = request.duration;
      if (!duration && request.endTime && callData.startTime) {
        duration = Math.round((request.endTime.getTime() - callData.startTime.getTime()) / 1000);
      }

      // Create updated call data
      const updateData = {
        status: request.status,
        ...(request.endTime && { endTime: request.endTime }),
        ...(duration !== undefined && { duration }),
        ...(request.notes !== undefined && { notes: request.notes })
      };

      // Update call record
      const updatedCall = await this.callRepository.update(request.callId, updateData);
      
      if (!updatedCall) {
        return createErrorResult('Failed to update call record');
      }

      return createSuccessResult({
        call: updatedCall
      });

    } catch (error) {
      return createErrorResult(`Failed to update call status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateRequest(request: UpdateCallStatusRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.callId?.trim()) {
      errors.push('Call ID is required');
    }

    if (!request.status) {
      errors.push('Status is required');
    }

    // If status is completed or failed, endTime should be provided
    if ((request.status === CallStatus.COMPLETED || request.status === CallStatus.FAILED) && !request.endTime) {
      errors.push('End time is required when call is completed or failed');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private isValidStatusTransition(currentStatus: CallStatus, newStatus: CallStatus): { isValid: boolean; error?: string } {
    const validTransitions: Record<CallStatus, CallStatus[]> = {
      [CallStatus.INITIATED]: [CallStatus.RINGING, CallStatus.FAILED, CallStatus.CANCELLED],
      [CallStatus.RINGING]: [CallStatus.ANSWERED, CallStatus.BUSY, CallStatus.NO_ANSWER, CallStatus.FAILED, CallStatus.CANCELLED],
      [CallStatus.ANSWERED]: [CallStatus.COMPLETED, CallStatus.FAILED, CallStatus.CANCELLED],
      [CallStatus.COMPLETED]: [], // Terminal state
      [CallStatus.FAILED]: [], // Terminal state
      [CallStatus.BUSY]: [], // Terminal state
      [CallStatus.NO_ANSWER]: [], // Terminal state
      [CallStatus.CANCELLED]: [] // Terminal state
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    
    if (!allowedTransitions.includes(newStatus)) {
      return {
        isValid: false,
        error: `Cannot change status from ${currentStatus} to ${newStatus}`
      };
    }

    return { isValid: true };
  }
}