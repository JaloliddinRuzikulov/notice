/**
 * Create Employee Use Case
 * Handles creation of new employee with validation
 */
import { IUseCase, UseCaseResult } from '../base/IUseCase';
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
export declare class CreateEmployeeUseCase implements IUseCase<CreateEmployeeRequest, UseCaseResult<CreateEmployeeResponse>> {
    private employeeRepository;
    constructor(employeeRepository: IEmployeeRepository);
    execute(request: CreateEmployeeRequest): Promise<UseCaseResult<CreateEmployeeResponse>>;
    private validateRequest;
}
//# sourceMappingURL=CreateEmployeeUseCase.d.ts.map