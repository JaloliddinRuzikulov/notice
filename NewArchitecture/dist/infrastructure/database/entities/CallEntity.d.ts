/**
 * Call Entity for TypeORM
 * Maps Call domain entity to database table
 */
import { BroadcastEntity } from './BroadcastEntity';
import { EmployeeEntity } from './EmployeeEntity';
import { AudioFileEntity } from './AudioFileEntity';
export declare enum CallStatusDB {
    INITIATED = "initiated",
    RINGING = "ringing",
    ANSWERED = "answered",
    COMPLETED = "completed",
    FAILED = "failed",
    BUSY = "busy",
    NO_ANSWER = "no_answer",
    CANCELLED = "cancelled"
}
export declare enum CallDirectionDB {
    INBOUND = "inbound",
    OUTBOUND = "outbound"
}
export declare enum CallTypeDB {
    BROADCAST = "broadcast",
    DIRECT = "direct",
    EMERGENCY = "emergency",
    TEST = "test"
}
export declare class CallEntity {
    id: string;
    callId: string;
    from: string;
    to: string;
    direction: CallDirectionDB;
    type: CallTypeDB;
    status: CallStatusDB;
    broadcastId?: string;
    broadcast?: BroadcastEntity;
    employeeId?: string;
    employee?: EmployeeEntity;
    sipExtension?: string;
    startTime: Date;
    answerTime?: Date;
    endTime?: Date;
    duration?: number;
    recordingId?: string;
    recording?: AudioFileEntity;
    recordingUrl?: string;
    dtmfInput?: string;
    failureReason?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    jitter?: number;
    packetLoss?: number;
    latency?: number;
    cost?: number;
    currency?: string;
}
//# sourceMappingURL=CallEntity.d.ts.map