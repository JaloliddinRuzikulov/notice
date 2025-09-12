/**
 * Integration Tests for CreateEmployeeUseCase
 */

import 'reflect-metadata';
import { CreateEmployeeUseCase, CreateEmployeeRequest } from '@/application/usecases/employee/CreateEmployeeUseCase';
import { MockEmployeeRepository } from '../../../mocks/repositories/MockEmployeeRepository';
import { Employee } from '@/core/domain/entities/Employee';

describe('CreateEmployeeUseCase Integration Tests', () => {
  let createEmployeeUseCase: CreateEmployeeUseCase;
  let mockEmployeeRepository: MockEmployeeRepository;

  beforeEach(() => {
    mockEmployeeRepository = new MockEmployeeRepository();
    createEmployeeUseCase = new CreateEmployeeUseCase(mockEmployeeRepository);
  });

  afterEach(() => {
    mockEmployeeRepository.clear();
  });

  const validCreateRequest: CreateEmployeeRequest = {
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '998901234567',
    department: 'dept-1',
    district: 'dist-1',
    position: 'Officer'
  };

  describe('Successful Employee Creation', () => {
    it('should create a new employee successfully', async () => {
      // Act
      const result = await createEmployeeUseCase.execute(validCreateRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.employee.firstName).toBe('John');
      expect(result.data?.employee.lastName).toBe('Doe');
      expect(result.data?.employee.phoneNumber).toBe('998901234567');

      // Verify employee was saved to repository
      const savedEmployees = await mockEmployeeRepository.findAll();
      expect(savedEmployees).toHaveLength(1);
      expect(savedEmployees[0].firstName).toBe('John');
    });

    it('should create employee with minimal required fields', async () => {
      // Arrange
      const minimalRequest: CreateEmployeeRequest = {
        firstName: 'Jane',
        lastName: 'Smith',
        phoneNumber: '998907654321',
        department: 'dept-2',
        district: 'dist-2'
      };

      // Act
      const result = await createEmployeeUseCase.execute(minimalRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.employee.firstName).toBe('Jane');
    });

    it('should handle employee with middle name', async () => {
      // Arrange
      const requestWithMiddleName: CreateEmployeeRequest = {
        ...validCreateRequest,
        middleName: 'Michael'
      };

      // Act
      const result = await createEmployeeUseCase.execute(requestWithMiddleName);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.employee.middleName).toBe('Michael');
    });
  });

  describe('Validation Errors', () => {
    it('should fail with invalid phone number format', async () => {
      // Arrange
      const invalidRequest: CreateEmployeeRequest = {
        ...validCreateRequest,
        phoneNumber: '123' // Invalid format
      };

      // Act
      const result = await createEmployeeUseCase.execute(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number format');

      // Verify no employee was created
      const savedEmployees = await mockEmployeeRepository.findAll();
      expect(savedEmployees).toHaveLength(0);
    });

    it('should fail with empty first name', async () => {
      // Arrange
      const invalidRequest: CreateEmployeeRequest = {
        ...validCreateRequest,
        firstName: '' // Empty first name
      };

      // Act
      const result = await createEmployeeUseCase.execute(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('First name is required');
    });

    it('should fail with empty last name', async () => {
      // Arrange
      const invalidRequest: CreateEmployeeRequest = {
        ...validCreateRequest,
        lastName: '' // Empty last name
      };

      // Act
      const result = await createEmployeeUseCase.execute(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Last name is required');
    });
  });

  describe('Duplicate Handling', () => {
    beforeEach(async () => {
      // Add existing employee
      const existingEmployee = Employee.create({
        firstName: 'Existing',
        lastName: 'Employee',
        phoneNumber: '998901234567',
        department: 'dept-1',
        district: 'dist-1',
        isActive: true
      });
      await mockEmployeeRepository.save(existingEmployee);
    });

    it('should fail when phone number already exists', async () => {
      // Arrange - request with same phone number
      const duplicateRequest: CreateEmployeeRequest = {
        ...validCreateRequest,
        firstName: 'Different',
        lastName: 'Person'
      };

      // Act
      const result = await createEmployeeUseCase.execute(duplicateRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Employee with this phone number already exists');

      // Verify no additional employee was created
      const savedEmployees = await mockEmployeeRepository.findAll();
      expect(savedEmployees).toHaveLength(1); // Only the original one
    });
  });

  describe('Repository Error Handling', () => {
    it('should handle repository save errors gracefully', async () => {
      // Arrange - Mock repository to throw error
      jest.spyOn(mockEmployeeRepository, 'save').mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      // Act
      const result = await createEmployeeUseCase.execute(validCreateRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create employee');
    });

    it('should handle repository findByPhoneNumber errors gracefully', async () => {
      // Arrange - Mock repository to throw error
      jest.spyOn(mockEmployeeRepository, 'findByPhoneNumber').mockRejectedValueOnce(
        new Error('Database query failed')
      );

      // Act
      const result = await createEmployeeUseCase.execute(validCreateRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create employee');
    });
  });
});