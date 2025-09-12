/**
 * Get Employee List Use Case
 * Handles retrieving employees with search and pagination
 */

import { injectable, inject } from 'tsyringe';
import { IUseCase, UseCaseResult, createSuccessResult, createErrorResult } from '../base/IUseCase';
import { IEmployeeRepository, EmployeeSearchCriteria, PaginationOptions, PaginatedResult } from '@/core/domain/repositories/IEmployeeRepository';
import { Employee } from '@/core/domain/entities/Employee';

export interface GetEmployeeListRequest {
  search?: {
    name?: string;
    department?: string;
    district?: string;
    position?: string;
    rank?: string;
    phoneNumber?: string;
    isActive?: boolean;
  };
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  };
}

export interface GetEmployeeListResponse {
  employees: Employee[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@injectable()
export class GetEmployeeListUseCase implements IUseCase<GetEmployeeListRequest, UseCaseResult<GetEmployeeListResponse>> {
  constructor(
    @inject('IEmployeeRepository')
    private employeeRepository: IEmployeeRepository
  ) {}

  async execute(request: GetEmployeeListRequest): Promise<UseCaseResult<GetEmployeeListResponse>> {
    try {
      // If pagination is requested
      if (request.pagination) {
        const paginationOptions: PaginationOptions = {
          page: request.pagination.page || 1,
          limit: request.pagination.limit || 10,
          sortBy: request.pagination.sortBy || 'lastName',
          sortOrder: request.pagination.sortOrder || 'ASC'
        };

        let result: PaginatedResult<Employee>;

        // If search criteria provided
        if (request.search) {
          const searchCriteria: EmployeeSearchCriteria = {
            name: request.search.name,
            department: request.search.department,
            district: request.search.district,
            position: request.search.position,
            rank: request.search.rank,
            phoneNumber: request.search.phoneNumber,
            isActive: request.search.isActive
          };

          result = await this.employeeRepository.searchPaginated(searchCriteria, paginationOptions);
        } else {
          result = await this.employeeRepository.findPaginated(paginationOptions);
        }

        return createSuccessResult({
          employees: result.data,
          pagination: {
            page: result.page,
            limit: paginationOptions.limit,
            total: result.total,
            totalPages: result.totalPages
          }
        });
      } 
      // If no pagination, return all matching employees
      else {
        let employees: Employee[];

        if (request.search) {
          const searchCriteria: EmployeeSearchCriteria = {
            name: request.search.name,
            department: request.search.department,
            district: request.search.district,
            position: request.search.position,
            rank: request.search.rank,
            phoneNumber: request.search.phoneNumber,
            isActive: request.search.isActive
          };

          employees = await this.employeeRepository.search(searchCriteria);
        } else {
          employees = await this.employeeRepository.findAll();
        }

        return createSuccessResult({
          employees
        });
      }

    } catch (error) {
      return createErrorResult(`Failed to retrieve employees: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}