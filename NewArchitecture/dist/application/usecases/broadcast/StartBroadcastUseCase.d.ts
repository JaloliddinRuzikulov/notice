/**
 * Start Broadcast Use Case
 * Handles starting mass notification broadcast
 */
import { IUseCase, UseCaseResult } from '../base/IUseCase';
import { IBroadcastRepository } from '@/core/domain/repositories/IBroadcastRepository';
import { IEmployeeRepository } from '@/core/domain/repositories/IEmployeeRepository';
import { IAudioFileRepository } from '@/core/domain/repositories/IAudioFileRepository';
import { Broadcast, BroadcastType } from '@/core/domain/entities/Broadcast';
export interface StartBroadcastRequest {
    name: string;
    type: BroadcastType;
    audioFileId?: string;
    message?: string;
    targetEmployees?: string[];
    targetDepartments?: string[];
    targetDistricts?: string[];
    scheduledFor?: Date;
    createdBy: string;
}
export interface StartBroadcastResponse {
    broadcast: Broadcast;
}
export declare class StartBroadcastUseCase implements IUseCase<StartBroadcastRequest, UseCaseResult<StartBroadcastResponse>> {
    private broadcastRepository;
    private employeeRepository;
    private audioFileRepository;
    constructor(broadcastRepository: IBroadcastRepository, employeeRepository: IEmployeeRepository, audioFileRepository: IAudioFileRepository);
    execute(request: StartBroadcastRequest): Promise<UseCaseResult<StartBroadcastResponse>>;
    private validateRequest;
    private getTargetEmployees;
}
//# sourceMappingURL=StartBroadcastUseCase.d.ts.map