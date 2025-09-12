/**
 * Create Call Record Use Case
 * Handles creation of call history records
 */
import { IUseCase, UseCaseResult } from '../base/IUseCase';
import { ICallRepository } from '@/core/domain/repositories/ICallRepository';
import { IEmployeeRepository } from '@/core/domain/repositories/IEmployeeRepository';
import { Call, CallStatus } from '@/core/domain/entities/Call';
export interface CreateCallRecordRequest {
    employeeId: string;
    phoneNumber: string;
    broadcastId?: string;
    startTime: Date;
    endTime?: Date;
    status: CallStatus;
    duration?: number;
    callerId?: string;
    notes?: string;
}
export interface CreateCallRecordResponse {
    call: Call;
}
export declare class CreateCallRecordUseCase implements IUseCase<CreateCallRecordRequest, UseCaseResult<CreateCallRecordResponse>> {
    private callRepository;
    private employeeRepository;
    constructor(callRepository: ICallRepository, employeeRepository: IEmployeeRepository);
    execute(request: CreateCallRecordRequest): Promise<UseCaseResult<CreateCallRecordResponse>>;
    private validateRequest;
}
//# sourceMappingURL=CreateCallRecordUseCase.d.ts.map