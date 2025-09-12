/**
 * Get Broadcast Status Use Case
 * Handles retrieving broadcast status and progress
 */

import { injectable, inject } from 'tsyringe';
import { IUseCase, UseCaseResult, createSuccessResult, createErrorResult } from '../base/IUseCase';
import { IBroadcastRepository } from '@/core/domain/repositories/IBroadcastRepository';
import { ICallRepository } from '@/core/domain/repositories/ICallRepository';
import { CallStatus } from '@/core/domain/entities/Call';
import { Broadcast } from '@/core/domain/entities/Broadcast';

export interface GetBroadcastStatusRequest {
  broadcastId: string;
}

export interface GetBroadcastStatusResponse {
  broadcast: Broadcast;
  progress: {
    totalTargets: number;
    completed: number;
    inProgress: number;
    failed: number;
    pending: number;
    progressPercentage: number;
  };
  callHistory?: Array<{
    employeeId: string;
    employeeName: string;
    phoneNumber: string;
    status: string;
    startTime?: Date;
    endTime?: Date;
    duration?: number;
  }>;
}

@injectable()
export class GetBroadcastStatusUseCase implements IUseCase<GetBroadcastStatusRequest, UseCaseResult<GetBroadcastStatusResponse>> {
  constructor(
    @inject('IBroadcastRepository')
    private broadcastRepository: IBroadcastRepository,
    @inject('ICallRepository')
    private callRepository: ICallRepository
  ) {}

  async execute(request: GetBroadcastStatusRequest): Promise<UseCaseResult<GetBroadcastStatusResponse>> {
    try {
      // Validate request
      if (!request.broadcastId?.trim()) {
        return createErrorResult('Broadcast ID is required');
      }

      // Get broadcast
      const broadcast = await this.broadcastRepository.findById(request.broadcastId);
      if (!broadcast) {
        return createErrorResult('Broadcast not found');
      }

      const broadcastData = broadcast.toObject();

      // Get call history for this broadcast
      const calls = await this.callRepository.findByBroadcast(request.broadcastId);

      // Calculate progress
      const totalTargets = broadcastData.recipients ? broadcastData.recipients.length : 0;
      const completed = calls.filter(call => call.toObject().status === CallStatus.COMPLETED).length;
      const inProgress = calls.filter(call => 
        call.toObject().status === CallStatus.INITIATED || 
        call.toObject().status === CallStatus.RINGING ||
        call.toObject().status === CallStatus.ANSWERED
      ).length;
      const failed = calls.filter(call => 
        call.toObject().status === CallStatus.FAILED ||
        call.toObject().status === CallStatus.NO_ANSWER ||
        call.toObject().status === CallStatus.BUSY
      ).length;
      const pending = totalTargets - completed - inProgress - failed;
      const progressPercentage = totalTargets > 0 ? Math.round((completed / totalTargets) * 100) : 0;

      // Prepare call history
      const callHistory = calls.map(call => {
        const callData = call.toObject();
        return {
          employeeId: callData.employeeId,
          employeeName: 'Unknown', // Will need to look up from employee repository if needed
          phoneNumber: callData.to, // Using 'to' field for phone number
          status: callData.status,
          startTime: callData.startTime,
          endTime: callData.endTime,
          duration: callData.duration
        };
      });

      const response: GetBroadcastStatusResponse = {
        broadcast,
        progress: {
          totalTargets,
          completed,
          inProgress,
          failed,
          pending,
          progressPercentage
        },
        callHistory
      };

      return createSuccessResult(response);

    } catch (error) {
      return createErrorResult(`Failed to get broadcast status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}