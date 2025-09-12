/**
 * Get Broadcast Status Use Case
 * Handles retrieving broadcast status and progress
 */
import { IUseCase, UseCaseResult } from '../base/IUseCase';
import { IBroadcastRepository } from '@/core/domain/repositories/IBroadcastRepository';
import { ICallRepository } from '@/core/domain/repositories/ICallRepository';
import { Broadcast } from '@/core/domain/entities/Broadcast';
export interface GetBroadcastStatusRequest {
    broadcastId: string;
}
export interface GetBroadcastStatusResponse {
    broadcast: Broadcast;
    progress: {
        totalTargets: number;
        completed: number;
        inProgress: number;
        failed: number;
        pending: number;
        progressPercentage: number;
    };
    callHistory?: Array<{
        employeeId: string;
        employeeName: string;
        phoneNumber: string;
        status: string;
        startTime?: Date;
        endTime?: Date;
        duration?: number;
    }>;
}
export declare class GetBroadcastStatusUseCase implements IUseCase<GetBroadcastStatusRequest, UseCaseResult<GetBroadcastStatusResponse>> {
    private broadcastRepository;
    private callRepository;
    constructor(broadcastRepository: IBroadcastRepository, callRepository: ICallRepository);
    execute(request: GetBroadcastStatusRequest): Promise<UseCaseResult<GetBroadcastStatusResponse>>;
}
//# sourceMappingURL=GetBroadcastStatusUseCase.d.ts.map