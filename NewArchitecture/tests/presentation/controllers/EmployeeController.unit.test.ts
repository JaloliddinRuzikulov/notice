/**
 * Unit Test for EmployeeController
 * Tests controller logic with mocked dependencies
 */

import 'reflect-metadata';
import { Request, Response } from 'express';
import { EmployeeController } from '@/presentation/controllers/employee/EmployeeController';
import { createSuccessResult, createErrorResult } from '@/application/usecases/base/IUseCase';
import { Employee } from '@/core/domain/entities/Employee';

// Create mock response object
const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Create mock request object
const mockRequest = (body: any = {}, params: any = {}, query: any = {}) => {
  return {
    body,
    params,
    query
  } as Request;
};

// Mock use cases with minimal implementation
class MockCreateEmployeeUseCase {
  async execute(request: any): Promise<any> {
    if (request.firstName === 'TestError') {
      return createErrorResult('Invalid employee data provided');
    }
    
    try {
      const employee = Employee.create({
        firstName: request.firstName,
        lastName: request.lastName,
        phoneNumber: request.phoneNumber,
        department: request.department,
        district: request.district,
        isActive: true
      });

      return createSuccessResult({ employee });
    } catch (error) {
      return createErrorResult(error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

// Mock other required use cases
class MockUseCase {
  async execute(_request: any): Promise<any> {
    return createSuccessResult({ message: 'Mock response' });
  }
}

// Mock mapper
class MockEmployeeMapper {
  toDTO(employee: Employee): any {
    return {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      phoneNumber: employee.phoneNumber
    };
  }

  toCreateRequest(dto: any): any {
    return {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber,
      department: dto.department,
      district: dto.district
    };
  }
}

describe('EmployeeController', () => {
  let controller: EmployeeController;
  let mockCreateUseCase: MockCreateEmployeeUseCase;
  let mockMapper: MockEmployeeMapper;

  beforeEach(() => {
    mockCreateUseCase = new MockCreateEmployeeUseCase();
    mockMapper = new MockEmployeeMapper();

    // Create controller with mocks
    controller = new EmployeeController(
      mockCreateUseCase as any,
      new MockUseCase() as any,
      new MockUseCase() as any,
      new MockUseCase() as any,
      mockMapper as any
    );
  });

  describe('createEmployee', () => {
    it('should successfully create employee', async () => {
      // Arrange
      const req = mockRequest({
        firstName: 'Ahmad',
        lastName: 'Karimov',
        phoneNumber: '998901234567',
        department: 'IT',
        district: 'Qarshi'
      });
      const res = mockResponse();

      // Act
      await controller.createEmployee(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
          message: expect.any(String)
        })
      );
    });

    it('should handle validation errors', async () => {
      // Arrange - Missing required fields
      const req = mockRequest({
        firstName: 'Ahmad'
        // Missing lastName, phoneNumber, department, district
      });
      const res = mockResponse();

      // Act
      await controller.createEmployee(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String),
          errors: expect.any(Array)
        })
      );
    });

    it('should handle use case errors', async () => {
      // Arrange - Use case will return error for this firstName
      const req = mockRequest({
        firstName: 'TestError',
        lastName: 'Karimov',
        phoneNumber: '998901234567',
        department: 'IT',
        district: 'Qarshi'
      });
      const res = mockResponse();

      // Act
      await controller.createEmployee(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String)
        })
      );
    });
  });
});