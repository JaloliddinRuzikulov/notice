/**
 * Update Group Use Case
 * Handles updating existing group information and membership
 */

import { injectable, inject } from 'tsyringe';
import { IUseCase, UseCaseResult, createSuccessResult, createErrorResult } from '../base/IUseCase';
import { IGroupRepository } from '@/core/domain/repositories/IGroupRepository';
import { IEmployeeRepository } from '@/core/domain/repositories/IEmployeeRepository';
import { Group } from '@/core/domain/entities/Group';

export interface UpdateGroupRequest {
  groupId: string;
  name?: string;
  description?: string;
  employeeIds?: string[];
  isActive?: boolean;
  updatedBy: string;
}

export interface UpdateGroupResponse {
  group: Group;
}

@injectable()
export class UpdateGroupUseCase implements IUseCase<UpdateGroupRequest, UseCaseResult<UpdateGroupResponse>> {
  constructor(
    @inject('IGroupRepository')
    private groupRepository: IGroupRepository,
    @inject('IEmployeeRepository')
    private employeeRepository: IEmployeeRepository
  ) {}

  async execute(request: UpdateGroupRequest): Promise<UseCaseResult<UpdateGroupResponse>> {
    try {
      // Validate request
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return createErrorResult('Validation failed', validation.errors);
      }

      // Check if group exists
      const existingGroup = await this.groupRepository.findById(request.groupId);
      if (!existingGroup) {
        return createErrorResult('Group not found');
      }

      // Check if name is being changed and if new name already exists
      if (request.name && request.name !== existingGroup.toObject().name) {
        const nameExists = await this.groupRepository.findByName(request.name);
        if (nameExists) {
          return createErrorResult('Group name already exists');
        }
      }

      // Validate employees if being updated
      if (request.employeeIds) {
        if (request.employeeIds.length === 0) {
          return createErrorResult('At least one employee must be assigned to the group');
        }

        const employeeValidation = await this.validateEmployees(request.employeeIds);
        if (!employeeValidation.isValid) {
          return createErrorResult('Employee validation failed', employeeValidation.errors);
        }
      }

      // Create update data
      const updateData = {
        ...(request.name && { name: request.name.trim() }),
        ...(request.description !== undefined && { description: request.description }),
        ...(request.employeeIds && { employeeIds: request.employeeIds }),
        ...(request.isActive !== undefined && { isActive: request.isActive })
      };

      // Update group
      const updatedGroup = await this.groupRepository.update(request.groupId, updateData);
      
      if (!updatedGroup) {
        return createErrorResult('Failed to update group');
      }

      return createSuccessResult({
        group: updatedGroup
      });

    } catch (error) {
      return createErrorResult(`Failed to update group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateRequest(request: UpdateGroupRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.groupId?.trim()) {
      errors.push('Group ID is required');
    }

    if (!request.updatedBy?.trim()) {
      errors.push('Updater ID is required');
    }

    // Check if at least one field is being updated
    const hasUpdates = request.name || 
                      request.description !== undefined || 
                      request.employeeIds || 
                      request.isActive !== undefined;

    if (!hasUpdates) {
      errors.push('At least one field must be updated');
    }

    // Check for duplicate employee IDs if provided
    if (request.employeeIds) {
      const uniqueEmployeeIds = new Set(request.employeeIds);
      if (uniqueEmployeeIds.size !== request.employeeIds.length) {
        errors.push('Duplicate employee IDs found');
      }
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