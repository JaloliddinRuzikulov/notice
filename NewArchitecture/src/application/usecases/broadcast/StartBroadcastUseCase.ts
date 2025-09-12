/**
 * Start Broadcast Use Case
 * Handles starting mass notification broadcast
 */

import { injectable, inject } from 'tsyringe';
import { IUseCase, UseCaseResult, createSuccessResult, createErrorResult } from '../base/IUseCase';
import { IBroadcastRepository } from '@/core/domain/repositories/IBroadcastRepository';
import { IEmployeeRepository } from '@/core/domain/repositories/IEmployeeRepository';
import { IAudioFileRepository } from '@/core/domain/repositories/IAudioFileRepository';
import { Broadcast, BroadcastType, BroadcastStatus, BroadcastPriority } from '@/core/domain/entities/Broadcast';

export interface StartBroadcastRequest {
  name: string;
  type: BroadcastType;
  audioFileId?: string;
  message?: string;
  targetEmployees?: string[];
  targetDepartments?: string[];
  targetDistricts?: string[];
  scheduledFor?: Date;
  createdBy: string;
}

export interface StartBroadcastResponse {
  broadcast: Broadcast;
}

@injectable()
export class StartBroadcastUseCase implements IUseCase<StartBroadcastRequest, UseCaseResult<StartBroadcastResponse>> {
  constructor(
    @inject('IBroadcastRepository')
    private broadcastRepository: IBroadcastRepository,
    @inject('IEmployeeRepository')
    private employeeRepository: IEmployeeRepository,
    @inject('IAudioFileRepository')
    private audioFileRepository: IAudioFileRepository
  ) {}

  async execute(request: StartBroadcastRequest): Promise<UseCaseResult<StartBroadcastResponse>> {
    try {
      // Validate request
      const validation = await this.validateRequest(request);
      if (!validation.isValid) {
        return createErrorResult('Validation failed', validation.errors);
      }

      // Get target employees
      const targetEmployees = await this.getTargetEmployees(request);
      if (targetEmployees.length === 0) {
        return createErrorResult('No target employees found');
      }

      // Create broadcast entity
      const broadcast = Broadcast.create({
        title: request.name || 'New Broadcast',
        type: request.type,
        message: request.message || '',
        audioFileUrl: request.audioFileId, // Using audioFileId as URL for now
        priority: BroadcastPriority.NORMAL,
        status: request.scheduledFor && request.scheduledFor > new Date() 
          ? BroadcastStatus.PENDING 
          : BroadcastStatus.IN_PROGRESS,
        recipients: targetEmployees.map(emp => ({
          employeeId: emp.toObject().id,
          phoneNumber: emp.phoneNumber,
          name: emp.fullName,
          status: 'pending' as const,
          attempts: 0
        })),
        departmentIds: request.targetDepartments || [],
        districtIds: request.targetDistricts || [],
        groupIds: [],
        scheduledAt: request.scheduledFor,
        totalRecipients: targetEmployees.length,
        successCount: 0,
        failureCount: 0,
        createdBy: request.createdBy
      });

      // Save broadcast
      const savedBroadcast = await this.broadcastRepository.save(broadcast);

      // If not scheduled for future, start immediately
      if (!request.scheduledFor || request.scheduledFor <= new Date()) {
        await this.broadcastRepository.updateStatus(savedBroadcast.toObject().id, BroadcastStatus.IN_PROGRESS);
      }

      return createSuccessResult({
        broadcast: savedBroadcast
      });

    } catch (error) {
      return createErrorResult(`Failed to start broadcast: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validateRequest(request: StartBroadcastRequest): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate basic fields
    if (!request.name?.trim()) {
      errors.push('Broadcast name is required');
    }

    if (!request.type) {
      errors.push('Broadcast type is required');
    }

    if (!request.createdBy?.trim()) {
      errors.push('Creator ID is required');
    }

    // Validate content based on type
    if (request.type === BroadcastType.VOICE && !request.audioFileId) {
      errors.push('Audio file is required for voice broadcast');
    }

    if (request.type === BroadcastType.SMS && !request.message?.trim()) {
      errors.push('Message is required for SMS broadcast');
    }

    // Validate audio file exists if provided
    if (request.audioFileId) {
      const audioFile = await this.audioFileRepository.findById(request.audioFileId);
      if (!audioFile) {
        errors.push('Audio file not found');
      }
    }

    // Validate at least one target is specified
    const hasTargets = (request.targetEmployees && request.targetEmployees.length > 0) ||
                      (request.targetDepartments && request.targetDepartments.length > 0) ||
                      (request.targetDistricts && request.targetDistricts.length > 0);

    if (!hasTargets) {
      errors.push('At least one target (employees, departments, or districts) must be specified');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async getTargetEmployees(request: StartBroadcastRequest) {
    const targetEmployees = [];

    // Get specific employees
    if (request.targetEmployees && request.targetEmployees.length > 0) {
      for (const employeeId of request.targetEmployees) {
        const employee = await this.employeeRepository.findById(employeeId);
        if (employee && employee.toObject().isActive) {
          targetEmployees.push(employee);
        }
      }
    }

    // Get employees by departments
    if (request.targetDepartments && request.targetDepartments.length > 0) {
      for (const department of request.targetDepartments) {
        const employees = await this.employeeRepository.search({
          department: department,
          isActive: true
        });
        targetEmployees.push(...employees);
      }
    }

    // Get employees by districts
    if (request.targetDistricts && request.targetDistricts.length > 0) {
      for (const district of request.targetDistricts) {
        const employees = await this.employeeRepository.search({
          district: district,
          isActive: true
        });
        targetEmployees.push(...employees);
      }
    }

    // Remove duplicates
    const uniqueEmployees = targetEmployees.filter((employee, index, self) => 
      index === self.findIndex(e => e.toObject().id === employee.toObject().id)
    );

    return uniqueEmployees;
  }
}