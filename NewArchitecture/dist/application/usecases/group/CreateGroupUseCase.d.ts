/**
 * Create Group Use Case
 * Handles creation of employee groups
 */
import { IUseCase, UseCaseResult } from '../base/IUseCase';
import { IGroupRepository } from '@/core/domain/repositories/IGroupRepository';
import { IEmployeeRepository } from '@/core/domain/repositories/IEmployeeRepository';
import { Group } from '@/core/domain/entities/Group';
export interface CreateGroupRequest {
    name: string;
    description?: string;
    employeeIds: string[];
    createdBy: string;
}
export interface CreateGroupResponse {
    group: Group;
}
export declare class CreateGroupUseCase implements IUseCase<CreateGroupRequest, UseCaseResult<CreateGroupResponse>> {
    private groupRepository;
    private employeeRepository;
    constructor(groupRepository: IGroupRepository, employeeRepository: IEmployeeRepository);
    execute(request: CreateGroupRequest): Promise<UseCaseResult<CreateGroupResponse>>;
    private validateRequest;
    private validateEmployees;
}
//# sourceMappingURL=CreateGroupUseCase.d.ts.map