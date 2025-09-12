/**
 * Stop Broadcast Use Case
 * Handles stopping active broadcast
 */

import { injectable, inject } from 'tsyringe';
import { IUseCase, UseCaseResult, createSuccessResult, createErrorResult } from '../base/IUseCase';
import { IBroadcastRepository } from '@/core/domain/repositories/IBroadcastRepository';
import { BroadcastStatus } from '@/core/domain/entities/Broadcast';

export interface StopBroadcastRequest {
  broadcastId: string;
  stoppedBy: string;
  reason?: string;
}

export interface StopBroadcastResponse {
  success: boolean;
  message: string;
}

@injectable()
export class StopBroadcastUseCase implements IUseCase<StopBroadcastRequest, UseCaseResult<StopBroadcastResponse>> {
  constructor(
    @inject('IBroadcastRepository')
    private broadcastRepository: IBroadcastRepository
  ) {}

  async execute(request: StopBroadcastRequest): Promise<UseCaseResult<StopBroadcastResponse>> {
    try {
      // Validate request
      if (!request.broadcastId?.trim()) {
        return createErrorResult('Broadcast ID is required');
      }

      if (!request.stoppedBy?.trim()) {
        return createErrorResult('User ID is required');
      }

      // Check if broadcast exists
      const broadcast = await this.broadcastRepository.findById(request.broadcastId);
      if (!broadcast) {
        return createErrorResult('Broadcast not found');
      }

      const broadcastData = broadcast.toObject();

      // Check if broadcast can be stopped
      if (broadcastData.status === BroadcastStatus.COMPLETED) {
        return createErrorResult('Broadcast already completed');
      }

      if (broadcastData.status === BroadcastStatus.CANCELLED) {
        return createErrorResult('Broadcast already cancelled');
      }

      if (broadcastData.status === BroadcastStatus.FAILED) {
        return createErrorResult('Broadcast already failed');
      }

      // Update broadcast status to cancelled
      const updated = await this.broadcastRepository.updateStatus(
        request.broadcastId, 
        BroadcastStatus.CANCELLED
      );

      if (!updated) {
        return createErrorResult('Failed to stop broadcast');
      }

      // Record stop reason if provided
      // TODO: Implement addNote method in repository if needed
      // if (request.reason) {
      //   await this.broadcastRepository.addNote(request.broadcastId, {
      //     message: `Broadcast stopped: ${request.reason}`,
      //     createdBy: request.stoppedBy,
      //     createdAt: new Date()
      //   });
      // }

      return createSuccessResult({
        success: true,
        message: 'Broadcast successfully stopped'
      });

    } catch (error) {
      return createErrorResult(`Failed to stop broadcast: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}