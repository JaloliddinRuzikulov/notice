/**
 * Update Group Use Case
 * Handles updating existing group information and membership
 */
import { IUseCase, UseCaseResult } from '../base/IUseCase';
import { IGroupRepository } from '@/core/domain/repositories/IGroupRepository';
import { IEmployeeRepository } from '@/core/domain/repositories/IEmployeeRepository';
import { Group } from '@/core/domain/entities/Group';
export interface UpdateGroupRequest {
    groupId: string;
    name?: string;
    description?: string;
    employeeIds?: string[];
    isActive?: boolean;
    updatedBy: string;
}
export interface UpdateGroupResponse {
    group: Group;
}
export declare class UpdateGroupUseCase implements IUseCase<UpdateGroupRequest, UseCaseResult<UpdateGroupResponse>> {
    private groupRepository;
    private employeeRepository;
    constructor(groupRepository: IGroupRepository, employeeRepository: IEmployeeRepository);
    execute(request: UpdateGroupRequest): Promise<UseCaseResult<UpdateGroupResponse>>;
    private validateRequest;
    private validateEmployees;
}
//# sourceMappingURL=UpdateGroupUseCase.d.ts.map