/**
 * Delete Employee Use Case
 * Handles soft deletion of employee
 */

import { injectable, inject } from 'tsyringe';
import { IUseCase, UseCaseResult, createSuccessResult, createErrorResult } from '../base/IUseCase';
import { IEmployeeRepository } from '@/core/domain/repositories/IEmployeeRepository';

export interface DeleteEmployeeRequest {
  id: string;
}

export interface DeleteEmployeeResponse {
  success: boolean;
  message: string;
}

@injectable()
export class DeleteEmployeeUseCase implements IUseCase<DeleteEmployeeRequest, UseCaseResult<DeleteEmployeeResponse>> {
  constructor(
    @inject('IEmployeeRepository')
    private employeeRepository: IEmployeeRepository
  ) {}

  async execute(request: DeleteEmployeeRequest): Promise<UseCaseResult<DeleteEmployeeResponse>> {
    try {
      // Validate request
      if (!request.id?.trim()) {
        return createErrorResult('Employee ID is required');
      }

      // Check if employee exists
      const existingEmployee = await this.employeeRepository.findById(request.id);
      if (!existingEmployee) {
        return createErrorResult('Employee not found');
      }

      // TODO: Check if employee is referenced in any active broadcasts or calls
      // This would require additional repository checks

      // Perform soft delete (deactivate employee)
      const deactivated = await this.employeeRepository.deactivateEmployee(request.id);
      
      if (!deactivated) {
        return createErrorResult('Failed to delete employee');
      }

      return createSuccessResult({
        success: true,
        message: 'Employee successfully deleted'
      });

    } catch (error) {
      return createErrorResult(`Failed to delete employee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}