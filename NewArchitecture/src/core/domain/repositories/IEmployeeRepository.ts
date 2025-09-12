/**
 * Employee Repository Interface
 * Domain layer repository contract for Employee entity
 */

import { Employee } from '../entities/Employee';

export interface EmployeeSearchCriteria {
  name?: string;
  department?: string;
  district?: string;
  position?: string;
  rank?: string;
  phoneNumber?: string;
  isActive?: boolean;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface IEmployeeRepository {
  // Basic CRUD operations
  findById(id: string): Promise<Employee | null>;
  findByPhoneNumber(phoneNumber: string): Promise<Employee | null>;
  findAll(): Promise<Employee[]>;
  save(employee: Employee): Promise<Employee>;
  update(id: string, employee: Partial<Employee>): Promise<Employee | null>;
  delete(id: string): Promise<boolean>;
  
  // Advanced queries
  search(criteria: EmployeeSearchCriteria): Promise<Employee[]>;
  findByDepartment(department: string): Promise<Employee[]>;
  findByDistrict(district: string): Promise<Employee[]>;
  findByDepartmentAndDistrict(department: string, district: string): Promise<Employee[]>;
  
  // Pagination
  findPaginated(options: PaginationOptions): Promise<PaginatedResult<Employee>>;
  searchPaginated(
    criteria: EmployeeSearchCriteria, 
    options: PaginationOptions
  ): Promise<PaginatedResult<Employee>>;
  
  // Bulk operations
  saveMany(employees: Employee[]): Promise<Employee[]>;
  updateMany(updates: Array<{ id: string; data: Partial<Employee> }>): Promise<number>;
  deleteMany(ids: string[]): Promise<number>;
  
  // Statistics
  countByDepartment(): Promise<Record<string, number>>;
  countByDistrict(): Promise<Record<string, number>>;
  countActive(): Promise<number>;
  countTotal(): Promise<number>;
  
  // Special operations
  findActiveEmployees(): Promise<Employee[]>;
  findInactiveEmployees(): Promise<Employee[]>;
  activateEmployee(id: string): Promise<boolean>;
  deactivateEmployee(id: string): Promise<boolean>;
  
  // Check existence
  exists(id: string): Promise<boolean>;
  existsByPhoneNumber(phoneNumber: string): Promise<boolean>;
}