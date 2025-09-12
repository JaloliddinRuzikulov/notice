/**
 * Unit Test for EmployeeRepository
 * Tests domain model conversion without database
 */

import 'reflect-metadata';
import { Employee } from '@/core/domain/entities/Employee';

// Mock EmployeeEntity for testing
class MockEmployeeEntity {
  id: string = 'emp-123';
  firstName: string = 'Ahmad';
  lastName: string = 'Karimov';
  middleName?: string = undefined;
  phoneNumber: string = '998901234567';
  additionalPhone?: string = undefined;
  department: string = 'IT';
  district: string = 'Qarshi';
  position?: string = 'Developer';
  rank?: string = undefined;
  notes?: string = undefined;
  photoUrl?: string = undefined;
  isActive: boolean = true;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
}

describe('EmployeeRepository - Domain Model Conversion', () => {
  it('should convert domain Employee to entity-like object', () => {
    // Arrange
    const employee = Employee.create({
      id: 'emp-456',
      firstName: 'Bekzod',
      lastName: 'Umarov',
      phoneNumber: '998907654321',
      department: 'HR',
      district: 'Shahrisabz',
      position: 'Manager',
      isActive: true
    });

    // Act - Test toObject method (used by repository)
    const employeeObj = employee.toObject();

    // Assert
    expect(employeeObj).toEqual({
      id: 'emp-456',
      firstName: 'Bekzod',
      lastName: 'Umarov',
      middleName: undefined,
      phoneNumber: '998907654321',
      additionalPhone: undefined,
      department: 'HR',
      district: 'Shahrisabz',
      position: 'Manager',
      rank: undefined,
      notes: undefined,
      photoUrl: undefined,
      isActive: true,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date)
    });
  });

  it('should convert entity-like object to domain Employee', () => {
    // Arrange
    const mockEntity = new MockEmployeeEntity();

    // Act - Simulate what repository.toDomainModel would do
    const employee = Employee.create({
      id: mockEntity.id,
      firstName: mockEntity.firstName,
      lastName: mockEntity.lastName,
      middleName: mockEntity.middleName,
      phoneNumber: mockEntity.phoneNumber,
      additionalPhone: mockEntity.additionalPhone,
      department: mockEntity.department,
      district: mockEntity.district,
      position: mockEntity.position,
      rank: mockEntity.rank,
      notes: mockEntity.notes,
      photoUrl: mockEntity.photoUrl,
      isActive: mockEntity.isActive,
      createdAt: mockEntity.createdAt,
      updatedAt: mockEntity.updatedAt,
    });

    // Assert
    expect(employee.id).toBe('emp-123');
    expect(employee.firstName).toBe('Ahmad');
    expect(employee.lastName).toBe('Karimov');
    expect(employee.phoneNumber).toBe('998901234567');
    expect(employee.department).toBe('IT');
    expect(employee.district).toBe('Qarshi');
    expect(employee.isActive).toBe(true);
  });

  it('should handle optional fields correctly', () => {
    // Arrange - Employee with optional fields
    const employee = Employee.create({
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '998901111111',
      middleName: 'Middle',
      additionalPhone: '998907777777',
      department: 'Test Dept',
      district: 'Test District',
      position: 'Test Position',
      rank: 'Senior',
      notes: 'Test notes',
      photoUrl: 'http://test.com/photo.jpg',
      isActive: false
    });

    // Act
    const employeeObj = employee.toObject();

    // Assert
    expect(employeeObj.middleName).toBe('Middle');
    expect(employeeObj.additionalPhone).toBe('998907777777');
    expect(employeeObj.rank).toBe('Senior');
    expect(employeeObj.notes).toBe('Test notes');
    expect(employeeObj.photoUrl).toBe('http://test.com/photo.jpg');
    expect(employeeObj.isActive).toBe(false);
  });

  it('should validate phone number format in domain entity', () => {
    // Arrange & Act & Assert
    expect(() => {
      Employee.create({
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: 'invalid-phone',
        department: 'IT',
        district: 'Qarshi',
        isActive: true
      });
    }).toThrow('Invalid phone number format');
  });

  it('should validate required fields in domain entity', () => {
    // Test empty firstName
    expect(() => {
      Employee.create({
        firstName: '',
        lastName: 'User',
        phoneNumber: '998901234567',
        department: 'IT',
        district: 'Qarshi',
        isActive: true
      });
    }).toThrow('First name is required');

    // Test empty lastName
    expect(() => {
      Employee.create({
        firstName: 'Test',
        lastName: '',
        phoneNumber: '998901234567',
        department: 'IT',
        district: 'Qarshi',
        isActive: true
      });
    }).toThrow('Last name is required');
  });
});