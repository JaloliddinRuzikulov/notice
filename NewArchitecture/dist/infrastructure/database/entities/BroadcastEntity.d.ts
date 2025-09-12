/**
 * Broadcast Entity for TypeORM
 * Maps Broadcast domain entity to database table
 */
import { UserEntity } from './UserEntity';
import { CallEntity } from './CallEntity';
import { AudioFileEntity } from './AudioFileEntity';
export declare enum BroadcastStatusDB {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    FAILED = "failed"
}
export declare enum BroadcastTypeDB {
    VOICE = "voice",
    SMS = "sms",
    BOTH = "both"
}
export declare enum BroadcastPriorityDB {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    URGENT = "urgent"
}
export declare class BroadcastEntity {
    id: string;
    title: string;
    message: string;
    type: BroadcastTypeDB;
    priority: BroadcastPriorityDB;
    status: BroadcastStatusDB;
    recipients: Array<{
        employeeId?: string;
        phoneNumber: string;
        name?: string;
        status: string;
        attempts: number;
        lastAttemptAt?: Date;
        duration?: number;
        errorMessage?: string;
    }>;
    departmentIds?: string[];
    districtIds?: string[];
    groupIds?: string[];
    scheduledAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    totalRecipients: number;
    successCount: number;
    failureCount: number;
    averageDuration?: number;
    createdBy: string;
    creator?: UserEntity;
    cancelledBy?: string;
    canceller?: UserEntity;
    cancelReason?: string;
    audioFileId?: string;
    audioFile?: AudioFileEntity;
    audioFileUrl?: string;
    calls?: CallEntity[];
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    maxRetries: number;
    retryDelay: number;
    callTimeout: number;
    maxConcurrentCalls: number;
    processedCount: number;
    pendingCount: number;
    inProgressCount: number;
}
//# sourceMappingURL=BroadcastEntity.d.ts.map