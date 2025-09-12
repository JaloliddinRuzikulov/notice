/**
 * Broadcast Domain Entity
 * Represents a mass notification broadcast
 */
export declare enum BroadcastStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    FAILED = "failed"
}
export declare enum BroadcastType {
    VOICE = "voice",
    SMS = "sms",
    BOTH = "both"
}
export declare enum BroadcastPriority {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    URGENT = "urgent"
}
export interface BroadcastRecipient {
    employeeId?: string;
    phoneNumber: string;
    name?: string;
    status: 'pending' | 'calling' | 'success' | 'failed' | 'no_answer' | 'busy';
    attempts: number;
    lastAttemptAt?: Date;
    duration?: number;
    errorMessage?: string;
}
export interface BroadcastProps {
    id?: string;
    title: string;
    message: string;
    audioFileUrl?: string;
    type: BroadcastType;
    priority: BroadcastPriority;
    status: BroadcastStatus;
    recipients: BroadcastRecipient[];
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
    cancelledBy?: string;
    cancelReason?: string;
    metadata?: Record<string, any>;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class Broadcast {
    private readonly _id?;
    private _title;
    private _message;
    private _audioFileUrl?;
    private _type;
    private _priority;
    private _status;
    private _recipients;
    private _departmentIds?;
    private _districtIds?;
    private _groupIds?;
    private _scheduledAt?;
    private _startedAt?;
    private _completedAt?;
    private _totalRecipients;
    private _successCount;
    private _failureCount;
    private _averageDuration?;
    private _createdBy;
    private _cancelledBy?;
    private _cancelReason?;
    private _metadata?;
    private readonly _createdAt;
    private _updatedAt;
    constructor(props: BroadcastProps);
    get id(): string | undefined;
    get title(): string;
    get message(): string;
    get audioFileUrl(): string | undefined;
    get type(): BroadcastType;
    get priority(): BroadcastPriority;
    get status(): BroadcastStatus;
    get recipients(): BroadcastRecipient[];
    get totalRecipients(): number;
    get successCount(): number;
    get failureCount(): number;
    get startedAt(): Date | undefined;
    get completedAt(): Date | undefined;
    get createdBy(): string;
    get cancelledBy(): string | undefined;
    get cancelReason(): string | undefined;
    get progressPercentage(): number;
    get successRate(): number;
    get createdAt(): Date;
    get updatedAt(): Date;
    start(): void;
    complete(): void;
    cancel(cancelledBy: string, reason?: string): void;
    fail(reason?: string): void;
    addRecipient(recipient: BroadcastRecipient): void;
    updateRecipientStatus(phoneNumber: string, status: BroadcastRecipient['status'], duration?: number, errorMessage?: string): void;
    private calculateAverageDuration;
    private validateProps;
    private updateTimestamp;
    canBeStarted(): boolean;
    canBeCancelled(): boolean;
    isScheduled(): boolean;
    isActive(): boolean;
    static create(props: BroadcastProps): Broadcast;
    toObject(): BroadcastProps;
}
//# sourceMappingURL=Broadcast.d.ts.map