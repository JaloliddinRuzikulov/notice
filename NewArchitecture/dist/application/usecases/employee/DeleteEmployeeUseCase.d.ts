/**
 * Delete Employee Use Case
 * Handles soft deletion of employee
 */
import { IUseCase, UseCaseResult } from '../base/IUseCase';
import { IEmployeeRepository } from '@/core/domain/repositories/IEmployeeRepository';
export interface DeleteEmployeeRequest {
    id: string;
}
export interface DeleteEmployeeResponse {
    success: boolean;
    message: string;
}
export declare class DeleteEmployeeUseCase implements IUseCase<DeleteEmployeeRequest, UseCaseResult<DeleteEmployeeResponse>> {
    private employeeRepository;
    constructor(employeeRepository: IEmployeeRepository);
    execute(request: DeleteEmployeeRequest): Promise<UseCaseResult<DeleteEmployeeResponse>>;
}
//# sourceMappingURL=DeleteEmployeeUseCase.d.ts.map