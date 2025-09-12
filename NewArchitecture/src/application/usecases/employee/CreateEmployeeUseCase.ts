/**
 * Create Employee Use Case
 * Handles creation of new employee with validation
 */

import { injectable, inject } from 'tsyringe';
import { IUseCase, UseCaseResult, createSuccessResult, createErrorResult } from '../base/IUseCase';
import { IEmployeeRepository } from '@/core/domain/repositories/IEmployeeRepository';
import { Employee } from '@/core/domain/entities/Employee';

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  phoneNumber: string;
  additionalPhone?: string;
  department: string;
  district: string;
  position?: string;
  rank?: string;
  notes?: string;
  photoUrl?: string;
}

export interface CreateEmployeeResponse {
  employee: Employee;
}

@injectable()
export class CreateEmployeeUseCase implements IUseCase<CreateEmployeeRequest, UseCaseResult<CreateEmployeeResponse>> {
  constructor(
    @inject('IEmployeeRepository')
    private employeeRepository: IEmployeeRepository
  ) {}

  async execute(request: CreateEmployeeRequest): Promise<UseCaseResult<CreateEmployeeResponse>> {
    try {
      // Validate required fields
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return createErrorResult('Validation failed', validation.errors);
      }

      // Check if phone number already exists
      const existingEmployee = await this.employeeRepository.findByPhoneNumber(request.phoneNumber);
      if (existingEmployee) {
        return createErrorResult('Phone number already exists');
      }

      // Create employee entity
      const employee = Employee.create({
        firstName: request.firstName,
        lastName: request.lastName,
        middleName: request.middleName,
        phoneNumber: request.phoneNumber,
        additionalPhone: request.additionalPhone,
        department: request.department,
        district: request.district,
        position: request.position,
        rank: request.rank,
        notes: request.notes,
        photoUrl: request.photoUrl,
        isActive: true
      });

      // Save to repository
      const savedEmployee = await this.employeeRepository.save(employee);

      return createSuccessResult({
        employee: savedEmployee
      });

    } catch (error) {
      return createErrorResult(`Failed to create employee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateRequest(request: CreateEmployeeRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.firstName?.trim()) {
      errors.push('First name is required');
    }

    if (!request.lastName?.trim()) {
      errors.push('Last name is required');
    }

    if (!request.phoneNumber?.trim()) {
      errors.push('Phone number is required');
    } else {
      // Basic phone number validation (Uzbekistan format)
      const phoneRegex = /^(\+998|998)?[0-9]{9}$/;
      if (!phoneRegex.test(request.phoneNumber.replace(/\s|-/g, ''))) {
        errors.push('Invalid phone number format');
      }
    }

    if (!request.department?.trim()) {
      errors.push('Department is required');
    }

    if (!request.district?.trim()) {
      errors.push('District is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}