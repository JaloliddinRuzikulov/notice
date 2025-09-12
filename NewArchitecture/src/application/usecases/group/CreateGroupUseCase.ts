/**
 * Create Group Use Case
 * Handles creation of employee groups
 */

import { injectable, inject } from 'tsyringe';
import { IUseCase, UseCaseResult, createSuccessResult, createErrorResult } from '../base/IUseCase';
import { IGroupRepository } from '@/core/domain/repositories/IGroupRepository';
import { IEmployeeRepository } from '@/core/domain/repositories/IEmployeeRepository';
import { Group, GroupType } from '@/core/domain/entities/Group';

export interface CreateGroupRequest {
  name: string;
  description?: string;
  employeeIds: string[];
  createdBy: string;
}

export interface CreateGroupResponse {
  group: Group;
}

@injectable()
export class CreateGroupUseCase implements IUseCase<CreateGroupRequest, UseCaseResult<CreateGroupResponse>> {
  constructor(
    @inject('IGroupRepository')
    private groupRepository: IGroupRepository,
    @inject('IEmployeeRepository')
    private employeeRepository: IEmployeeRepository
  ) {}

  async execute(request: CreateGroupRequest): Promise<UseCaseResult<CreateGroupResponse>> {
    try {
      // Validate request
      const validation = await this.validateRequest(request);
      if (!validation.isValid) {
        return createErrorResult('Validation failed', validation.errors);
      }

      // Check if group name already exists
      const existingGroup = await this.groupRepository.findByName(request.name);
      if (existingGroup) {
        return createErrorResult('Group name already exists');
      }

      // Verify all employees exist and are active
      const employeeValidation = await this.validateEmployees(request.employeeIds);
      if (!employeeValidation.isValid) {
        return createErrorResult('Employee validation failed', employeeValidation.errors);
      }

      // Create group entity  
      const group = Group.create({
        name: request.name,
        description: request.description,
        type: GroupType.CUSTOM, // Default type for user-created groups
        members: [], // Initialize as empty, members will be added separately
        createdBy: request.createdBy,
        isActive: true
      });

      // Save group
      const savedGroup = await this.groupRepository.save(group);

      return createSuccessResult({
        group: savedGroup
      });

    } catch (error) {
      return createErrorResult(`Failed to create group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validateRequest(request: CreateGroupRequest): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!request.name?.trim()) {
      errors.push('Group name is required');
    }

    if (!request.createdBy?.trim()) {
      errors.push('Creator ID is required');
    }

    if (!request.employeeIds || request.employeeIds.length === 0) {
      errors.push('At least one employee must be assigned to the group');
    }

    // Check for duplicate employee IDs
    const uniqueEmployeeIds = new Set(request.employeeIds);
    if (uniqueEmployeeIds.size !== request.employeeIds.length) {
      errors.push('Duplicate employee IDs found');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async validateEmployees(employeeIds: string[]): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const employeeId of employeeIds) {
      const employee = await this.employeeRepository.findById(employeeId);
      if (!employee) {
        errors.push(`Employee with ID ${employeeId} not found`);
        continue;
      }

      const employeeData = employee.toObject();
      if (!employeeData.isActive) {
        errors.push(`Employee ${employeeData.firstName} ${employeeData.lastName} is not active`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}