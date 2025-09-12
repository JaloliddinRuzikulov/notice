/**
 * Delete Group Use Case
 * Handles soft deletion of groups
 */
import { IUseCase, UseCaseResult } from '../base/IUseCase';
import { IGroupRepository } from '@/core/domain/repositories/IGroupRepository';
import { IBroadcastRepository } from '@/core/domain/repositories/IBroadcastRepository';
export interface DeleteGroupRequest {
    groupId: string;
    deletedBy: string;
    force?: boolean;
}
export interface DeleteGroupResponse {
    success: boolean;
    message: string;
}
export declare class DeleteGroupUseCase implements IUseCase<DeleteGroupRequest, UseCaseResult<DeleteGroupResponse>> {
    private groupRepository;
    private broadcastRepository;
    constructor(groupRepository: IGroupRepository, broadcastRepository: IBroadcastRepository);
    execute(request: DeleteGroupRequest): Promise<UseCaseResult<DeleteGroupResponse>>;
}
//# sourceMappingURL=DeleteGroupUseCase.d.ts.map