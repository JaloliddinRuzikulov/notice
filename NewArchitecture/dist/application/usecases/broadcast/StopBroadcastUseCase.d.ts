/**
 * Stop Broadcast Use Case
 * Handles stopping active broadcast
 */
import { IUseCase, UseCaseResult } from '../base/IUseCase';
import { IBroadcastRepository } from '@/core/domain/repositories/IBroadcastRepository';
export interface StopBroadcastRequest {
    broadcastId: string;
    stoppedBy: string;
    reason?: string;
}
export interface StopBroadcastResponse {
    success: boolean;
    message: string;
}
export declare class StopBroadcastUseCase implements IUseCase<StopBroadcastRequest, UseCaseResult<StopBroadcastResponse>> {
    private broadcastRepository;
    constructor(broadcastRepository: IBroadcastRepository);
    execute(request: StopBroadcastRequest): Promise<UseCaseResult<StopBroadcastResponse>>;
}
//# sourceMappingURL=StopBroadcastUseCase.d.ts.map