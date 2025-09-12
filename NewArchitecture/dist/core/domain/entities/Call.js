"use strict";
/**
 * Call Domain Entity
 * Represents individual call records and history
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Call = exports.CallType = exports.CallDirection = exports.CallStatus = void 0;
var CallStatus;
(function (CallStatus) {
    CallStatus["INITIATED"] = "initiated";
    CallStatus["RINGING"] = "ringing";
    CallStatus["ANSWERED"] = "answered";
    CallStatus["COMPLETED"] = "completed";
    CallStatus["FAILED"] = "failed";
    CallStatus["BUSY"] = "busy";
    CallStatus["NO_ANSWER"] = "no_answer";
    CallStatus["CANCELLED"] = "cancelled";
})(CallStatus || (exports.CallStatus = CallStatus = {}));
var CallDirection;
(function (CallDirection) {
    CallDirection["INBOUND"] = "inbound";
    CallDirection["OUTBOUND"] = "outbound";
})(CallDirection || (exports.CallDirection = CallDirection = {}));
var CallType;
(function (CallType) {
    CallType["BROADCAST"] = "broadcast";
    CallType["DIRECT"] = "direct";
    CallType["EMERGENCY"] = "emergency";
    CallType["TEST"] = "test";
})(CallType || (exports.CallType = CallType = {}));
class Call {
    _id;
    _callId;
    _from;
    _to;
    _direction;
    _type;
    _status;
    _broadcastId;
    _employeeId;
    _sipExtension;
    _startTime;
    _answerTime;
    _endTime;
    _duration;
    _recordingUrl;
    _dtmfInput;
    _failureReason;
    _metadata;
    _createdAt;
    _updatedAt;
    constructor(props) {
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
    get id() {
        return this._id;
    }
    get callId() {
        return this._callId;
    }
    get from() {
        return this._from;
    }
    get to() {
        return this._to;
    }
    get direction() {
        return this._direction;
    }
    get type() {
        return this._type;
    }
    get status() {
        return this._status;
    }
    get broadcastId() {
        return this._broadcastId;
    }
    get employeeId() {
        return this._employeeId;
    }
    get sipExtension() {
        return this._sipExtension;
    }
    get startTime() {
        return this._startTime;
    }
    get answerTime() {
        return this._answerTime;
    }
    get endTime() {
        return this._endTime;
    }
    get duration() {
        return this._duration;
    }
    get recordingUrl() {
        return this._recordingUrl;
    }
    get dtmfInput() {
        return this._dtmfInput;
    }
    get failureReason() {
        return this._failureReason;
    }
    get metadata() {
        return this._metadata;
    }
    get createdAt() {
        return this._createdAt;
    }
    get updatedAt() {
        return this._updatedAt;
    }
    // Business methods
    ring() {
        if (this._status !== CallStatus.INITIATED) {
            throw new Error('Can only ring initiated calls');
        }
        this._status = CallStatus.RINGING;
        this.updateTimestamp();
    }
    answer() {
        if (this._status !== CallStatus.RINGING) {
            throw new Error('Can only answer ringing calls');
        }
        this._status = CallStatus.ANSWERED;
        this._answerTime = new Date();
        this.updateTimestamp();
    }
    complete() {
        if (this._status !== CallStatus.ANSWERED) {
            throw new Error('Can only complete answered calls');
        }
        this._status = CallStatus.COMPLETED;
        this._endTime = new Date();
        this.calculateDuration();
        this.updateTimestamp();
    }
    fail(reason) {
        this._status = CallStatus.FAILED;
        this._failureReason = reason;
        this._endTime = new Date();
        this.calculateDuration();
        this.updateTimestamp();
    }
    markBusy() {
        this._status = CallStatus.BUSY;
        this._endTime = new Date();
        this.calculateDuration();
        this.updateTimestamp();
    }
    markNoAnswer() {
        this._status = CallStatus.NO_ANSWER;
        this._endTime = new Date();
        this.calculateDuration();
        this.updateTimestamp();
    }
    cancel() {
        if (this._status === CallStatus.COMPLETED) {
            throw new Error('Cannot cancel completed calls');
        }
        this._status = CallStatus.CANCELLED;
        this._endTime = new Date();
        this.calculateDuration();
        this.updateTimestamp();
    }
    updateStatus(status) {
        this._status = status;
        this.updateTimestamp();
    }
    setRecording(url) {
        this._recordingUrl = url;
        this.updateTimestamp();
    }
    addDtmfInput(input) {
        if (!this._dtmfInput) {
            this._dtmfInput = '';
        }
        this._dtmfInput += input;
        this.updateTimestamp();
    }
    clearDtmfInput() {
        this._dtmfInput = undefined;
        this.updateTimestamp();
    }
    updateMetadata(key, value) {
        if (!this._metadata) {
            this._metadata = {};
        }
        this._metadata[key] = value;
        this.updateTimestamp();
    }
    calculateDuration() {
        if (this._startTime && this._endTime) {
            const durationMs = this._endTime.getTime() - this._startTime.getTime();
            this._duration = Math.round(durationMs / 1000); // Convert to seconds
        }
    }
    normalizePhoneNumber(phoneNumber) {
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
    validateProps(props) {
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
    updateTimestamp() {
        this._updatedAt = new Date();
    }
    // Business rules
    isActive() {
        return this._status === CallStatus.INITIATED ||
            this._status === CallStatus.RINGING ||
            this._status === CallStatus.ANSWERED;
    }
    isCompleted() {
        return this._status === CallStatus.COMPLETED;
    }
    isFailed() {
        return this._status === CallStatus.FAILED ||
            this._status === CallStatus.BUSY ||
            this._status === CallStatus.NO_ANSWER;
    }
    isAnswered() {
        return this._status === CallStatus.ANSWERED ||
            this._status === CallStatus.COMPLETED;
    }
    getFormattedDuration() {
        if (!this._duration)
            return '0:00';
        const minutes = Math.floor(this._duration / 60);
        const seconds = this._duration % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    getWaitTime() {
        if (!this._answerTime || !this._startTime)
            return undefined;
        return Math.round((this._answerTime.getTime() - this._startTime.getTime()) / 1000);
    }
    // Factory method
    static create(props) {
        return new Call(props);
    }
    // Convert to plain object
    toObject() {
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
exports.Call = Call;
//# sourceMappingURL=Call.js.map