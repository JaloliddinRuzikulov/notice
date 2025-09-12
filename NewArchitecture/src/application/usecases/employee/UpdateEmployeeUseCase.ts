/**
 * Update Employee Use Case
 * Handles updating existing employee information
 */

import { injectable, inject } from 'tsyringe';
import { IUseCase, UseCaseResult, createSuccessResult, createErrorResult } from '../base/IUseCase';
import { IEmployeeRepository } from '@/core/domain/repositories/IEmployeeRepository';
import { Employee } from '@/core/domain/entities/Employee';

export interface UpdateEmployeeRequest {
  id: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phoneNumber?: string;
  additionalPhone?: string;
  department?: string;
  district?: string;
  position?: string;
  rank?: string;
  notes?: string;
  photoUrl?: string;
  isActive?: boolean;
}

export interface UpdateEmployeeResponse {
  employee: Employee;
}

@injectable()
export class UpdateEmployeeUseCase implements IUseCase<UpdateEmployeeRequest, UseCaseResult<UpdateEmployeeResponse>> {
  constructor(
    @inject('IEmployeeRepository')
    private employeeRepository: IEmployeeRepository
  ) {}

  async execute(request: UpdateEmployeeRequest): Promise<UseCaseResult<UpdateEmployeeResponse>> {
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

      // Check phone number uniqueness if it's being changed
      if (request.phoneNumber && request.phoneNumber !== existingEmployee.toObject().phoneNumber) {
        const phoneExists = await this.employeeRepository.findByPhoneNumber(request.phoneNumber);
        if (phoneExists) {
          return createErrorResult('Phone number already exists');
        }
      }

      // Validate phone number format if provided
      if (request.phoneNumber) {
        const phoneRegex = /^(\+998|998)?[0-9]{9}$/;
        if (!phoneRegex.test(request.phoneNumber.replace(/\s|-/g, ''))) {
          return createErrorResult('Invalid phone number format');
        }
      }

      // Create updated employee data
      const updateData = {
        ...(request.firstName && { firstName: request.firstName.trim() }),
        ...(request.lastName && { lastName: request.lastName.trim() }),
        ...(request.middleName && { middleName: request.middleName.trim() }),
        ...(request.phoneNumber && { phoneNumber: request.phoneNumber.trim() }),
        ...(request.additionalPhone && { additionalPhone: request.additionalPhone.trim() }),
        ...(request.department && { department: request.department.trim() }),
        ...(request.district && { district: request.district.trim() }),
        ...(request.position && { position: request.position.trim() }),
        ...(request.rank && { rank: request.rank.trim() }),
        ...(request.notes !== undefined && { notes: request.notes }),
        ...(request.photoUrl !== undefined && { photoUrl: request.photoUrl }),
        ...(request.isActive !== undefined && { isActive: request.isActive })
      };

      // Update employee
      const updatedEmployee = await this.employeeRepository.update(request.id, updateData);
      
      if (!updatedEmployee) {
        return createErrorResult('Failed to update employee');
      }

      return createSuccessResult({
        employee: updatedEmployee
      });

    } catch (error) {
      return createErrorResult(`Failed to update employee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}