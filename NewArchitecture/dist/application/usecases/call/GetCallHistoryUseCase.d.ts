/**
 * Get Call History Use Case
 * Handles retrieving call history with search and pagination
 */
import { IUseCase, UseCaseResult } from '../base/IUseCase';
import { ICallRepository } from '@/core/domain/repositories/ICallRepository';
import { Call, CallStatus } from '@/core/domain/entities/Call';
export interface GetCallHistoryRequest {
    search?: {
        employeeId?: string;
        employeeName?: string;
        phoneNumber?: string;
        broadcastId?: string;
        status?: CallStatus;
        dateRange?: {
            startDate: Date;
            endDate: Date;
        };
        minDuration?: number;
        maxDuration?: number;
    };
    pagination?: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
    };
}
export interface GetCallHistoryResponse {
    calls: Call[];
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    statistics?: {
        totalCalls: number;
        successfulCalls: number;
        failedCalls: number;
        averageDuration: number;
    };
}
export declare class GetCallHistoryUseCase implements IUseCase<GetCallHistoryRequest, UseCaseResult<GetCallHistoryResponse>> {
    private callRepository;
    constructor(callRepository: ICallRepository);
    execute(request: GetCallHistoryRequest): Promise<UseCaseResult<GetCallHistoryResponse>>;
    private calculateStatistics;
}
//# sourceMappingURL=GetCallHistoryUseCase.d.ts.map