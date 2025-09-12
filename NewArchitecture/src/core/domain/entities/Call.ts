/**
 * Call Domain Entity
 * Represents individual call records and history
 */

export enum CallStatus {
  INITIATED = 'initiated',
  RINGING = 'ringing',
  ANSWERED = 'answered',
  COMPLETED = 'completed',
  FAILED = 'failed',
  BUSY = 'busy',
  NO_ANSWER = 'no_answer',
  CANCELLED = 'cancelled'
}

export enum CallDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound'
}

export enum CallType {
  BROADCAST = 'broadcast',
  DIRECT = 'direct',
  EMERGENCY = 'emergency',
  TEST = 'test'
}

export interface CallProps {
  id?: string;
  callId: string; // SIP Call-ID
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
  duration?: number; // in seconds
  recordingUrl?: string;
  dtmfInput?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Call {
  private readonly _id?: string;
  private _callId: string;
  private _from: string;
  private _to: string;
  private _direction: CallDirection;
  private _type: CallType;
  private _status: CallStatus;
  private _broadcastId?: string;
  private _employeeId?: string;
  private _sipExtension?: string;
  private _startTime: Date;
  private _answerTime?: Date;
  private _endTime?: Date;
  private _duration?: number;
  private _recordingUrl?: string;
  private _dtmfInput?: string;
  private _failureReason?: string;
  private _metadata?: Record<string, any>;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: CallProps) {
    this.validateProps(props);
    
    this._id = props.id;
    this._callId = props.callId;
    this._from = this.normalizePhoneNumber(props.from);
    this._to = this.normalizePhoneNumber(props.to);
    this._direction = props.direction;
    this._type = props.type;
    this._status = props.status;
    this._broadcastId = props.broadcastId;
    this._employeeId = props.employeeId;
    this._sipExtension = props.sipExtension;
    this._startTime = props.startTime;
    this._answerTime = props.answerTime;
    this._endTime = props.endTime;
    this._duration = props.duration;
    this._recordingUrl = props.recordingUrl;
    this._dtmfInput = props.dtmfInput;
    this._failureReason = props.failureReason;
    this._metadata = props.metadata;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // Getters
  get id(): string | undefined {
    return this._id;
  }

  get callId(): string {
    return this._callId;
  }

  get from(): string {
    return this._from;
  }

  get to(): string {
    return this._to;
  }

  get direction(): CallDirection {
    return this._direction;
  }

  get type(): CallType {
    return this._type;
  }

  get status(): CallStatus {
    return this._status;
  }

  get broadcastId(): string | undefined {
    return this._broadcastId;
  }

  get employeeId(): string | undefined {
    return this._employeeId;
  }

  get sipExtension(): string | undefined {
    return this._sipExtension;
  }

  get startTime(): Date {
    return this._startTime;
  }

  get answerTime(): Date | undefined {
    return this._answerTime;
  }

  get endTime(): Date | undefined {
    return this._endTime;
  }

  get duration(): number | undefined {
    return this._duration;
  }

  get recordingUrl(): string | undefined {
    return this._recordingUrl;
  }

  get dtmfInput(): string | undefined {
    return this._dtmfInput;
  }

  get failureReason(): string | undefined {
    return this._failureReason;
  }

  get metadata(): Record<string, any> | undefined {
    return this._metadata;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business methods
  ring(): void {
    if (this._status !== CallStatus.INITIATED) {
      throw new Error('Can only ring initiated calls');
    }
    this._status = CallStatus.RINGING;
    this.updateTimestamp();
  }

  answer(): void {
    if (this._status !== CallStatus.RINGING) {
      throw new Error('Can only answer ringing calls');
    }
    this._status = CallStatus.ANSWERED;
    this._answerTime = new Date();
    this.updateTimestamp();
  }

  complete(): void {
    if (this._status !== CallStatus.ANSWERED) {
      throw new Error('Can only complete answered calls');
    }
    this._status = CallStatus.COMPLETED;
    this._endTime = new Date();
    this.calculateDuration();
    this.updateTimestamp();
  }

  fail(reason: string): void {
    this._status = CallStatus.FAILED;
    this._failureReason = reason;
    this._endTime = new Date();
    this.calculateDuration();
    this.updateTimestamp();
  }

  markBusy(): void {
    this._status = CallStatus.BUSY;
    this._endTime = new Date();
    this.calculateDuration();
    this.updateTimestamp();
  }

  markNoAnswer(): void {
    this._status = CallStatus.NO_ANSWER;
    this._endTime = new Date();
    this.calculateDuration();
    this.updateTimestamp();
  }

  cancel(): void {
    if (this._status === CallStatus.COMPLETED) {
      throw new Error('Cannot cancel completed calls');
    }
    this._status = CallStatus.CANCELLED;
    this._endTime = new Date();
    this.calculateDuration();
    this.updateTimestamp();
  }

  updateStatus(status: CallStatus): void {
    this._status = status;
    this.updateTimestamp();
  }

  setRecording(url: string): void {
    this._recordingUrl = url;
    this.updateTimestamp();
  }

  addDtmfInput(input: string): void {
    if (!this._dtmfInput) {
      this._dtmfInput = '';
    }
    this._dtmfInput += input;
    this.updateTimestamp();
  }

  clearDtmfInput(): void {
    this._dtmfInput = undefined;
    this.updateTimestamp();
  }

  updateMetadata(key: string, value: any): void {
    if (!this._metadata) {
      this._metadata = {};
    }
    this._metadata[key] = value;
    this.updateTimestamp();
  }

  private calculateDuration(): void {
    if (this._startTime && this._endTime) {
      const durationMs = this._endTime.getTime() - this._startTime.getTime();
      this._duration = Math.round(durationMs / 1000); // Convert to seconds
    }
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    // Remove SIP URI format if present
    if (phoneNumber.includes('@')) {
      phoneNumber = phoneNumber.split('@')[0];
    }
    if (phoneNumber.startsWith('sip:')) {
      phoneNumber = phoneNumber.substring(4);
    }
    
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it's a short extension (3-4 digits), keep as is
    if (cleaned.length <= 4) {
      return cleaned;
    }
    
    // Otherwise, treat as phone number
    return cleaned;
  }

  // Validation
  private validateProps(props: CallProps): void {
    if (!props.callId) {
      throw new Error('Call ID is required');
    }
    if (!props.from) {
      throw new Error('From number is required');
    }
    if (!props.to) {
      throw new Error('To number is required');
    }
    if (!props.startTime) {
      throw new Error('Start time is required');
    }
  }

  private updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  // Business rules
  isActive(): boolean {
    return this._status === CallStatus.INITIATED || 
           this._status === CallStatus.RINGING || 
           this._status === CallStatus.ANSWERED;
  }

  isCompleted(): boolean {
    return this._status === CallStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this._status === CallStatus.FAILED || 
           this._status === CallStatus.BUSY || 
           this._status === CallStatus.NO_ANSWER;
  }

  isAnswered(): boolean {
    return this._status === CallStatus.ANSWERED || 
           this._status === CallStatus.COMPLETED;
  }

  getFormattedDuration(): string {
    if (!this._duration) return '0:00';
    
    const minutes = Math.floor(this._duration / 60);
    const seconds = this._duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  getWaitTime(): number | undefined {
    if (!this._answerTime || !this._startTime) return undefined;
    return Math.round((this._answerTime.getTime() - this._startTime.getTime()) / 1000);
  }

  // Factory method
  static create(props: CallProps): Call {
    return new Call(props);
  }

  // Convert to plain object
  toObject(): CallProps {
    return {
      id: this._id,
      callId: this._callId,
      from: this._from,
      to: this._to,
      direction: this._direction,
      type: this._type,
      status: this._status,
      broadcastId: this._broadcastId,
      employeeId: this._employeeId,
      sipExtension: this._sipExtension,
      startTime: this._startTime,
      answerTime: this._answerTime,
      endTime: this._endTime,
      duration: this._duration,
      recordingUrl: this._recordingUrl,
      dtmfInput: this._dtmfInput,
      failureReason: this._failureReason,
      metadata: this._metadata ? { ...this._metadata } : undefined,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}