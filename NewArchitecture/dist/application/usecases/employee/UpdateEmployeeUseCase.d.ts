/**
 * Update Employee Use Case
 * Handles updating existing employee information
 */
import { IUseCase, UseCaseResult } from '../base/IUseCase';
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
export declare class UpdateEmployeeUseCase implements IUseCase<UpdateEmployeeRequest, UseCaseResult<UpdateEmployeeResponse>> {
    private employeeRepository;
    constructor(employeeRepository: IEmployeeRepository);
    execute(request: UpdateEmployeeRequest): Promise<UseCaseResult<UpdateEmployeeResponse>>;
}
//# sourceMappingURL=UpdateEmployeeUseCase.d.ts.map