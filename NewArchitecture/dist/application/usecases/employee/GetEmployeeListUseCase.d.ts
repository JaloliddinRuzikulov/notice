/**
 * Get Employee List Use Case
 * Handles retrieving employees with search and pagination
 */
import { IUseCase, UseCaseResult } from '../base/IUseCase';
import { IEmployeeRepository } from '@/core/domain/repositories/IEmployeeRepository';
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
export declare class GetEmployeeListUseCase implements IUseCase<GetEmployeeListRequest, UseCaseResult<GetEmployeeListResponse>> {
    private employeeRepository;
    constructor(employeeRepository: IEmployeeRepository);
    execute(request: GetEmployeeListRequest): Promise<UseCaseResult<GetEmployeeListResponse>>;
}
//# sourceMappingURL=GetEmployeeListUseCase.d.ts.map