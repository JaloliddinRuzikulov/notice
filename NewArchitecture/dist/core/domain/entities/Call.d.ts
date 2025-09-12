/**
 * Call Domain Entity
 * Represents individual call records and history
 */
export declare enum CallStatus {
    INITIATED = "initiated",
    RINGING = "ringing",
    ANSWERED = "answered",
    COMPLETED = "completed",
    FAILED = "failed",
    BUSY = "busy",
    NO_ANSWER = "no_answer",
    CANCELLED = "cancelled"
}
export declare enum CallDirection {
    INBOUND = "inbound",
    OUTBOUND = "outbound"
}
export declare enum CallType {
    BROADCAST = "broadcast",
    DIRECT = "direct",
    EMERGENCY = "emergency",
    TEST = "test"
}
export interface CallProps {
    id?: string;
    callId: string;
    from: string;
    to: string;
    direction: CallDirection;
    type: CallType;
    status: CallStatus;
    broadcastId?: string;
    employeeId?: string;
    sipExtension?: string;
    startTime: Date;
    answerTime?: Date;
    endTime?: Date;
    duration?: number;
    recordingUrl?: string;
    dtmfInput?: string;
    failureReason?: string;
    metadata?: Record<string, any>;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class Call {
    private readonly _id?;
    private _callId;
    private _from;
    private _to;
    private _direction;
    private _type;
    private _status;
    private _broadcastId?;
    private _employeeId?;
    private _sipExtension?;
    private _startTime;
    private _answerTime?;
    private _endTime?;
    private _duration?;
    private _recordingUrl?;
    private _dtmfInput?;
    private _failureReason?;
    private _metadata?;
    private readonly _createdAt;
    private _updatedAt;
    constructor(props: CallProps);
    get id(): string | undefined;
    get callId(): string;
    get from(): string;
    get to(): string;
    get direction(): CallDirection;
    get type(): CallType;
    get status(): CallStatus;
    get broadcastId(): string | undefined;
    get employeeId(): string | undefined;
    get sipExtension(): string | undefined;
    get startTime(): Date;
    get answerTime(): Date | undefined;
    get endTime(): Date | undefined;
    get duration(): number | undefined;
    get recordingUrl(): string | undefined;
    get dtmfInput(): string | undefined;
    get failureReason(): string | undefined;
    get metadata(): Record<string, any> | undefined;
    get createdAt(): Date;
    get updatedAt(): Date;
    ring(): void;
    answer(): void;
    complete(): void;
    fail(reason: string): void;
    markBusy(): void;
    markNoAnswer(): void;
    cancel(): void;
    updateStatus(status: CallStatus): void;
    setRecording(url: string): void;
    addDtmfInput(input: string): void;
    clearDtmfInput(): void;
    updateMetadata(key: string, value: any): void;
    private calculateDuration;
    private normalizePhoneNumber;
    private validateProps;
    private updateTimestamp;
    isActive(): boolean;
    isCompleted(): boolean;
    isFailed(): boolean;
    isAnswered(): boolean;
    getFormattedDuration(): string;
    getWaitTime(): number | undefined;
    static create(props: CallProps): Call;
    toObject(): CallProps;
}
//# sourceMappingURL=Call.d.ts.map