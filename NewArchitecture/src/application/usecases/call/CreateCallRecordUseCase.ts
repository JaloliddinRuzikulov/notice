/**
 * Create Call Record Use Case
 * Handles creation of call history records
 */

import { injectable, inject } from 'tsyringe';
import { IUseCase, UseCaseResult, createSuccessResult, createErrorResult } from '../base/IUseCase';
import { ICallRepository } from '@/core/domain/repositories/ICallRepository';
import { IEmployeeRepository } from '@/core/domain/repositories/IEmployeeRepository';
import { Call, CallStatus, CallDirection, CallType } from '@/core/domain/entities/Call';

export interface CreateCallRecordRequest {
  employeeId: string;
  phoneNumber: string;
  broadcastId?: string;
  startTime: Date;
  endTime?: Date;
  status: CallStatus;
  duration?: number;
  callerId?: string;
  notes?: string;
}

export interface CreateCallRecordResponse {
  call: Call;
}

@injectable()
export class CreateCallRecordUseCase implements IUseCase<CreateCallRecordRequest, UseCaseResult<CreateCallRecordResponse>> {
  constructor(
    @inject('ICallRepository')
    private callRepository: ICallRepository,
    @inject('IEmployeeRepository')
    private employeeRepository: IEmployeeRepository
  ) {}

  async execute(request: CreateCallRecordRequest): Promise<UseCaseResult<CreateCallRecordResponse>> {
    try {
      // Validate request
      const validation = await this.validateRequest(request);
      if (!validation.isValid) {
        return createErrorResult('Validation failed', validation.errors);
      }

      // Get employee information
      const employee = await this.employeeRepository.findById(request.employeeId);
      if (!employee) {
        return createErrorResult('Employee not found');
      }

      const employeeData = employee.toObject();

      // Calculate duration if not provided
      let duration = request.duration;
      if (!duration && request.endTime) {
        duration = Math.round((request.endTime.getTime() - request.startTime.getTime()) / 1000);
      }

      // Create call entity
      const call = Call.create({
        callId: `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        from: request.callerId || 'system',
        to: request.phoneNumber,
        direction: CallDirection.OUTBOUND,
        type: request.broadcastId ? CallType.BROADCAST : CallType.DIRECT,
        status: request.status,
        broadcastId: request.broadcastId,
        employeeId: request.employeeId,
        startTime: request.startTime,
        endTime: request.endTime,
        duration: duration || 0
      });

      // Save call record
      const savedCall = await this.callRepository.save(call);

      return createSuccessResult({
        call: savedCall
      });

    } catch (error) {
      return createErrorResult(`Failed to create call record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validateRequest(request: CreateCallRecordRequest): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!request.employeeId?.trim()) {
      errors.push('Employee ID is required');
    }

    if (!request.phoneNumber?.trim()) {
      errors.push('Phone number is required');
    } else {
      // Basic phone number validation
      const phoneRegex = /^(\+998|998)?[0-9]{9}$/;
      if (!phoneRegex.test(request.phoneNumber.replace(/\s|-/g, ''))) {
        errors.push('Invalid phone number format');
      }
    }

    if (!request.startTime) {
      errors.push('Start time is required');
    }

    if (!request.status) {
      errors.push('Call status is required');
    }

    // Validate end time is after start time
    if (request.endTime && request.startTime && request.endTime < request.startTime) {
      errors.push('End time cannot be before start time');
    }

    // Validate duration matches time difference
    if (request.duration && request.endTime && request.startTime) {
      const calculatedDuration = Math.round((request.endTime.getTime() - request.startTime.getTime()) / 1000);
      const difference = Math.abs(calculatedDuration - request.duration);
      if (difference > 5) { // Allow 5 seconds tolerance
        errors.push('Duration does not match start and end times');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}