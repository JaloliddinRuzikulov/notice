/**
 * Call Data Transfer Objects
 */
import { BaseDTO } from '../base/BaseDTO';
import { CallStatus } from '@/core/domain/entities/Call';
export declare class CallDTO extends BaseDTO {
    employeeId: string;
    employeeName: string;
    phoneNumber: string;
    broadcastId?: string;
    broadcastName?: string;
    startTime: Date;
    endTime?: Date;
    status: CallStatus;
    duration: number;
    callerId?: string;
    notes?: string;
    constructor(data: {
        id: string;
        employeeId: string;
        employeeName: string;
        phoneNumber: string;
        broadcastId?: string;
        broadcastName?: string;
        startTime: Date;
        endTime?: Date;
        status: CallStatus;
        duration: number;
        callerId?: string;
        notes?: string;
        createdAt: Date;
        updatedAt: Date;
    });
    get isCompleted(): boolean;
    get isFailed(): boolean;
    get formattedDuration(): string;
}
export interface CreateCallRecordDTO {
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
export interface UpdateCallStatusDTO {
    status: CallStatus;
    endTime?: Date;
    duration?: number;
    notes?: string;
}
export interface CallSearchDTO {
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
}
export interface CallHistoryRequestDTO {
    search?: CallSearchDTO;
    pagination?: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
    };
}
export interface CallStatisticsDTO {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageDuration: number;
    successRate: number;
}
export interface CallHistoryResponseDTO {
    calls: CallDTO[];
    statistics: CallStatisticsDTO;
}
export interface CallReportDTO {
    period: {
        startDate: Date;
        endDate: Date;
    };
    statistics: CallStatisticsDTO;
    topEmployees: Array<{
        employeeId: string;
        employeeName: string;
        callCount: number;
        successRate: number;
    }>;
    hourlyDistribution: Array<{
        hour: number;
        callCount: number;
    }>;
    statusDistribution: Array<{
        status: CallStatus;
        count: number;
        percentage: number;
    }>;
}
//# sourceMappingURL=CallDTO.d.ts.map