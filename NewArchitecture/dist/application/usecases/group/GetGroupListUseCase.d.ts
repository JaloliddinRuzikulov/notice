/**
 * Get Group List Use Case
 * Handles retrieving groups with search and pagination
 */
import { IUseCase, UseCaseResult } from '../base/IUseCase';
import { IGroupRepository } from '@/core/domain/repositories/IGroupRepository';
import { Group } from '@/core/domain/entities/Group';
export interface GetGroupListRequest {
    search?: {
        name?: string;
        createdBy?: string;
        isActive?: boolean;
        hasEmployee?: string;
    };
    pagination?: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
    };
    includeEmployees?: boolean;
}
export interface GetGroupListResponse {
    groups: Array<Group & {
        employees?: Array<{
            id: string;
            firstName: string;
            lastName: string;
            phoneNumber: string;
            department: string;
            isActive: boolean;
        }>;
    }>;
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
export declare class GetGroupListUseCase implements IUseCase<GetGroupListRequest, UseCaseResult<GetGroupListResponse>> {
    private groupRepository;
    constructor(groupRepository: IGroupRepository);
    execute(request: GetGroupListRequest): Promise<UseCaseResult<GetGroupListResponse>>;
    private enhanceGroupsWithEmployees;
}
//# sourceMappingURL=GetGroupListUseCase.d.ts.map