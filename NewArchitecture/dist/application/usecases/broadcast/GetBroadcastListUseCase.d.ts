/**
 * Get Broadcast List Use Case
 * Handles retrieving broadcast list with search and pagination
 */
import { IUseCase, UseCaseResult } from '../base/IUseCase';
import { IBroadcastRepository } from '@/core/domain/repositories/IBroadcastRepository';
import { Broadcast, BroadcastStatus, BroadcastType } from '@/core/domain/entities/Broadcast';
export interface GetBroadcastListRequest {
    search?: {
        name?: string;
        type?: BroadcastType;
        status?: BroadcastStatus;
        createdBy?: string;
        dateRange?: {
            startDate: Date;
            endDate: Date;
        };
    };
    pagination?: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
    };
}
export interface GetBroadcastListResponse {
    broadcasts: Broadcast[];
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
export declare class GetBroadcastListUseCase implements IUseCase<GetBroadcastListRequest, UseCaseResult<GetBroadcastListResponse>> {
    private broadcastRepository;
    constructor(broadcastRepository: IBroadcastRepository);
    execute(request: GetBroadcastListRequest): Promise<UseCaseResult<GetBroadcastListResponse>>;
}
//# sourceMappingURL=GetBroadcastListUseCase.d.ts.map