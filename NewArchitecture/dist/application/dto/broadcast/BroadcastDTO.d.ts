/**
 * Broadcast Data Transfer Objects
 */
import { BaseDTO } from '../base/BaseDTO';
import { BroadcastType, BroadcastStatus } from '@/core/domain/entities/Broadcast';
export declare class BroadcastDTO extends BaseDTO {
    name: string;
    type: BroadcastType;
    audioFileId?: string;
    message?: string;
    targetEmployees: string[];
    targetDepartments: string[];
    targetDistricts: string[];
    scheduledFor: Date;
    startedAt?: Date;
    completedAt?: Date;
    status: BroadcastStatus;
    progress: number;
    createdBy: string;
    notes?: string;
    constructor(data: {
        id: string;
        name: string;
        type: BroadcastType;
        audioFileId?: string;
        message?: string;
        targetEmployees: string[];
        targetDepartments: string[];
        targetDistricts: string[];
        scheduledFor: Date;
        startedAt?: Date;
        completedAt?: Date;
        status: BroadcastStatus;
        progress: number;
        createdBy: string;
        notes?: string;
        createdAt: Date;
        updatedAt: Date;
    });
    get isActive(): boolean;
    get isCompleted(): boolean;
    get duration(): number | null;
}
export interface CreateBroadcastDTO {
    name: string;
    type: BroadcastType;
    audioFileId?: string;
    message?: string;
    targetEmployees?: string[];
    targetDepartments?: string[];
    targetDistricts?: string[];
    scheduledFor?: Date;
}
export interface BroadcastSearchDTO {
    name?: string;
    type?: BroadcastType;
    status?: BroadcastStatus;
    createdBy?: string;
    dateRange?: {
        startDate: Date;
        endDate: Date;
    };
}
export interface BroadcastListRequestDTO {
    search?: BroadcastSearchDTO;
    pagination?: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
    };
}
export interface BroadcastProgressDTO {
    totalTargets: number;
    completed: number;
    inProgress: number;
    failed: number;
    pending: number;
    progressPercentage: number;
}
export interface BroadcastStatusDTO {
    broadcast: BroadcastDTO;
    progress: BroadcastProgressDTO;
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
export interface StartBroadcastResponseDTO {
    broadcastId: string;
    message: string;
    scheduledFor: Date;
}
export interface StopBroadcastDTO {
    reason?: string;
}
//# sourceMappingURL=BroadcastDTO.d.ts.map