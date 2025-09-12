/**
 * Simple Integration Test for CreateEmployeeUseCase
 * Minimal test to verify the use case actually works
 */

import 'reflect-metadata';
import { CreateEmployeeUseCase, CreateEmployeeRequest } from '@/application/usecases/employee/CreateEmployeeUseCase';
import { Employee } from '@/core/domain/entities/Employee';
import { IEmployeeRepository } from '@/core/domain/repositories/IEmployeeRepository';

// Minimal mock repository - only implementing methods we actually use
class MinimalMockEmployeeRepository implements Pick<IEmployeeRepository, 'findByPhoneNumber' | 'save'> {
  private employees: Employee[] = [];

  async findByPhoneNumber(phoneNumber: string): Promise<Employee | null> {
    return this.employees.find(emp => emp.phoneNumber === phoneNumber) || null;
  }

  async save(employee: Employee): Promise<Employee> {
    this.employees.push(employee);
    return employee;
  }

  // Test helper
  clear(): void {
    this.employees = [];
  }
}

describe('CreateEmployeeUseCase - Simple Test', () => {
  let useCase: CreateEmployeeUseCase;
  let mockRepo: MinimalMockEmployeeRepository;

  beforeEach(() => {
    mockRepo = new MinimalMockEmployeeRepository();
    // Cast to full interface for DI - we only use the methods we implemented
    useCase = new CreateEmployeeUseCase(mockRepo as any);
  });

  afterEach(() => {
    mockRepo.clear();
  });

  it('should create employee with valid data', async () => {
    // Arrange
    const request: CreateEmployeeRequest = {
      firstName: 'Ahmad',
      lastName: 'Karimov',
      phoneNumber: '998901234567',
      department: 'IT',
      district: 'Qarshi'
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.employee.firstName).toBe('Ahmad');
    expect(result.data?.employee.lastName).toBe('Karimov');
    expect(result.data?.employee.phoneNumber).toBe('998901234567');
    expect(result.data?.employee.isActive).toBe(true);
  });

  it('should fail with invalid phone number', async () => {
    // Arrange
    const request: CreateEmployeeRequest = {
      firstName: 'Ahmad',
      lastName: 'Karimov',
      phoneNumber: '123', // Invalid phone
      department: 'IT',
      district: 'Qarshi'
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Invalid phone number format');
  });

  it('should fail with empty first name', async () => {
    // Arrange
    const request: CreateEmployeeRequest = {
      firstName: '', // Empty
      lastName: 'Karimov',
      phoneNumber: '998901234567',
      department: 'IT',
      district: 'Qarshi'
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toContain('First name is required');
  });

  it('should prevent duplicate phone numbers', async () => {
    // Arrange
    const request1: CreateEmployeeRequest = {
      firstName: 'Ahmad',
      lastName: 'Karimov',
      phoneNumber: '998901234567',
      department: 'IT',
      district: 'Qarshi'
    };

    const request2: CreateEmployeeRequest = {
      firstName: 'Bekzod',
      lastName: 'Umarov',
      phoneNumber: '998901234567', // Same phone
      department: 'HR',
      district: 'Shahrisabz'
    };

    // Act
    const result1 = await useCase.execute(request1);
    const result2 = await useCase.execute(request2);

    // Assert
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(false);
    expect(result2.error).toContain('Phone number already exists');
  });
});