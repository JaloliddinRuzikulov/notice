/**
 * Broadcast Domain Entity
 * Represents a mass notification broadcast
 */

export enum BroadcastStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed'
}

export enum BroadcastType {
  VOICE = 'voice',
  SMS = 'sms',
  BOTH = 'both'
}

export enum BroadcastPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
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

export class Broadcast {
  private readonly _id?: string;
  private _title: string;
  private _message: string;
  private _audioFileUrl?: string;
  private _type: BroadcastType;
  private _priority: BroadcastPriority;
  private _status: BroadcastStatus;
  private _recipients: BroadcastRecipient[];
  private _departmentIds?: string[];
  private _districtIds?: string[];
  private _groupIds?: string[];
  private _scheduledAt?: Date;
  private _startedAt?: Date;
  private _completedAt?: Date;
  private _totalRecipients: number;
  private _successCount: number;
  private _failureCount: number;
  private _averageDuration?: number;
  private _createdBy: string;
  private _cancelledBy?: string;
  private _cancelReason?: string;
  private _metadata?: Record<string, any>;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: BroadcastProps) {
    this.validateProps(props);
    
    this._id = props.id;
    this._title = props.title;
    this._message = props.message;
    this._audioFileUrl = props.audioFileUrl;
    this._type = props.type;
    this._priority = props.priority;
    this._status = props.status;
    this._recipients = props.recipients;
    this._departmentIds = props.departmentIds;
    this._districtIds = props.districtIds;
    this._groupIds = props.groupIds;
    this._scheduledAt = props.scheduledAt;
    this._startedAt = props.startedAt;
    this._completedAt = props.completedAt;
    this._totalRecipients = props.totalRecipients;
    this._successCount = props.successCount;
    this._failureCount = props.failureCount;
    this._averageDuration = props.averageDuration;
    this._createdBy = props.createdBy;
    this._cancelledBy = props.cancelledBy;
    this._cancelReason = props.cancelReason;
    this._metadata = props.metadata;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // Getters
  get id(): string | undefined {
    return this._id;
  }

  get title(): string {
    return this._title;
  }

  get message(): string {
    return this._message;
  }

  get audioFileUrl(): string | undefined {
    return this._audioFileUrl;
  }

  get type(): BroadcastType {
    return this._type;
  }

  get priority(): BroadcastPriority {
    return this._priority;
  }

  get status(): BroadcastStatus {
    return this._status;
  }

  get recipients(): BroadcastRecipient[] {
    return this._recipients;
  }

  get totalRecipients(): number {
    return this._totalRecipients;
  }

  get successCount(): number {
    return this._successCount;
  }

  get failureCount(): number {
    return this._failureCount;
  }

  get startedAt(): Date | undefined {
    return this._startedAt;
  }

  get completedAt(): Date | undefined {
    return this._completedAt;
  }

  get createdBy(): string {
    return this._createdBy;
  }

  get cancelledBy(): string | undefined {
    return this._cancelledBy;
  }

  get cancelReason(): string | undefined {
    return this._cancelReason;
  }

  get progressPercentage(): number {
    if (this._totalRecipients === 0) return 0;
    return Math.round(((this._successCount + this._failureCount) / this._totalRecipients) * 100);
  }

  get successRate(): number {
    const completed = this._successCount + this._failureCount;
    if (completed === 0) return 0;
    return Math.round((this._successCount / completed) * 100);
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business methods
  start(): void {
    if (this._status !== BroadcastStatus.PENDING) {
      throw new Error('Can only start pending broadcasts');
    }
    this._status = BroadcastStatus.IN_PROGRESS;
    this._startedAt = new Date();
    this.updateTimestamp();
  }

  complete(): void {
    if (this._status !== BroadcastStatus.IN_PROGRESS) {
      throw new Error('Can only complete in-progress broadcasts');
    }
    this._status = BroadcastStatus.COMPLETED;
    this._completedAt = new Date();
    this.calculateAverageDuration();
    this.updateTimestamp();
  }

  cancel(cancelledBy: string, reason?: string): void {
    if (this._status === BroadcastStatus.COMPLETED || this._status === BroadcastStatus.CANCELLED) {
      throw new Error('Cannot cancel completed or already cancelled broadcasts');
    }
    this._status = BroadcastStatus.CANCELLED;
    this._cancelledBy = cancelledBy;
    this._cancelReason = reason;
    this._completedAt = new Date();
    this.updateTimestamp();
  }

  fail(reason?: string): void {
    this._status = BroadcastStatus.FAILED;
    if (reason && this._metadata) {
      this._metadata.failureReason = reason;
    }
    this._completedAt = new Date();
    this.updateTimestamp();
  }

  addRecipient(recipient: BroadcastRecipient): void {
    this._recipients.push(recipient);
    this._totalRecipients++;
    this.updateTimestamp();
  }

  updateRecipientStatus(
    phoneNumber: string, 
    status: BroadcastRecipient['status'],
    duration?: number,
    errorMessage?: string
  ): void {
    const recipient = this._recipients.find(r => r.phoneNumber === phoneNumber);
    if (!recipient) {
      throw new Error(`Recipient with phone ${phoneNumber} not found`);
    }
    
    const previousStatus = recipient.status;
    recipient.status = status;
    recipient.lastAttemptAt = new Date();
    recipient.attempts++;
    
    if (duration) {
      recipient.duration = duration;
    }
    
    if (errorMessage) {
      recipient.errorMessage = errorMessage;
    }
    
    // Update counters
    if (status === 'success' && previousStatus !== 'success') {
      this._successCount++;
    } else if ((status === 'failed' || status === 'no_answer') && 
               previousStatus !== 'failed' && previousStatus !== 'no_answer') {
      this._failureCount++;
    }
    
    this.updateTimestamp();
  }

  private calculateAverageDuration(): void {
    const durations = this._recipients
      .filter(r => r.duration && r.duration > 0)
      .map(r => r.duration!);
    
    if (durations.length > 0) {
      const sum = durations.reduce((acc, d) => acc + d, 0);
      this._averageDuration = Math.round(sum / durations.length);
    }
  }

  // Validation
  private validateProps(props: BroadcastProps): void {
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('Broadcast title is required');
    }
    if (!props.message || props.message.trim().length === 0) {
      throw new Error('Broadcast message is required');
    }
    if (!props.createdBy) {
      throw new Error('Broadcast creator is required');
    }
    if (props.recipients.length === 0 && !props.departmentIds?.length && 
        !props.districtIds?.length && !props.groupIds?.length) {
      throw new Error('Broadcast must have at least one recipient or target group');
    }
  }

  private updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  // Business rules
  canBeStarted(): boolean {
    return this._status === BroadcastStatus.PENDING;
  }

  canBeCancelled(): boolean {
    return this._status !== BroadcastStatus.COMPLETED && 
           this._status !== BroadcastStatus.CANCELLED;
  }

  isScheduled(): boolean {
    return !!this._scheduledAt && this._scheduledAt > new Date();
  }

  isActive(): boolean {
    return this._status === BroadcastStatus.IN_PROGRESS;
  }

  // Factory method
  static create(props: BroadcastProps): Broadcast {
    return new Broadcast(props);
  }

  // Convert to plain object
  toObject(): BroadcastProps {
    return {
      id: this._id,
      title: this._title,
      message: this._message,
      audioFileUrl: this._audioFileUrl,
      type: this._type,
      priority: this._priority,
      status: this._status,
      recipients: this._recipients,
      departmentIds: this._departmentIds,
      districtIds: this._districtIds,
      groupIds: this._groupIds,
      scheduledAt: this._scheduledAt,
      startedAt: this._startedAt,
      completedAt: this._completedAt,
      totalRecipients: this._totalRecipients,
      successCount: this._successCount,
      failureCount: this._failureCount,
      averageDuration: this._averageDuration,
      createdBy: this._createdBy,
      cancelledBy: this._cancelledBy,
      cancelReason: this._cancelReason,
      metadata: this._metadata,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}