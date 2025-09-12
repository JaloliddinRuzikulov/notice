/**
 * Update Call Status Use Case
 * Handles updating call record status and information
 */
import { IUseCase, UseCaseResult } from '../base/IUseCase';
import { ICallRepository } from '@/core/domain/repositories/ICallRepository';
import { Call, CallStatus } from '@/core/domain/entities/Call';
export interface UpdateCallStatusRequest {
    callId: string;
    status: CallStatus;
    endTime?: Date;
    duration?: number;
    notes?: string;
    updatedBy?: string;
}
export interface UpdateCallStatusResponse {
    call: Call;
}
export declare class UpdateCallStatusUseCase implements IUseCase<UpdateCallStatusRequest, UseCaseResult<UpdateCallStatusResponse>> {
    private callRepository;
    constructor(callRepository: ICallRepository);
    execute(request: UpdateCallStatusRequest): Promise<UseCaseResult<UpdateCallStatusResponse>>;
    private validateRequest;
    private isValidStatusTransition;
}
//# sourceMappingURL=UpdateCallStatusUseCase.d.ts.map