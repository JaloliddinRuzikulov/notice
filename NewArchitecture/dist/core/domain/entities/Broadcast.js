"use strict";
/**
 * Broadcast Domain Entity
 * Represents a mass notification broadcast
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Broadcast = exports.BroadcastPriority = exports.BroadcastType = exports.BroadcastStatus = void 0;
var BroadcastStatus;
(function (BroadcastStatus) {
    BroadcastStatus["PENDING"] = "pending";
    BroadcastStatus["IN_PROGRESS"] = "in_progress";
    BroadcastStatus["COMPLETED"] = "completed";
    BroadcastStatus["CANCELLED"] = "cancelled";
    BroadcastStatus["FAILED"] = "failed";
})(BroadcastStatus || (exports.BroadcastStatus = BroadcastStatus = {}));
var BroadcastType;
(function (BroadcastType) {
    BroadcastType["VOICE"] = "voice";
    BroadcastType["SMS"] = "sms";
    BroadcastType["BOTH"] = "both";
})(BroadcastType || (exports.BroadcastType = BroadcastType = {}));
var BroadcastPriority;
(function (BroadcastPriority) {
    BroadcastPriority["LOW"] = "low";
    BroadcastPriority["NORMAL"] = "normal";
    BroadcastPriority["HIGH"] = "high";
    BroadcastPriority["URGENT"] = "urgent";
})(BroadcastPriority || (exports.BroadcastPriority = BroadcastPriority = {}));
class Broadcast {
    _id;
    _title;
    _message;
    _audioFileUrl;
    _type;
    _priority;
    _status;
    _recipients;
    _departmentIds;
    _districtIds;
    _groupIds;
    _scheduledAt;
    _startedAt;
    _completedAt;
    _totalRecipients;
    _successCount;
    _failureCount;
    _averageDuration;
    _createdBy;
    _cancelledBy;
    _cancelReason;
    _metadata;
    _createdAt;
    _updatedAt;
    constructor(props) {
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
    get id() {
        return this._id;
    }
    get title() {
        return this._title;
    }
    get message() {
        return this._message;
    }
    get audioFileUrl() {
        return this._audioFileUrl;
    }
    get type() {
        return this._type;
    }
    get priority() {
        return this._priority;
    }
    get status() {
        return this._status;
    }
    get recipients() {
        return this._recipients;
    }
    get totalRecipients() {
        return this._totalRecipients;
    }
    get successCount() {
        return this._successCount;
    }
    get failureCount() {
        return this._failureCount;
    }
    get startedAt() {
        return this._startedAt;
    }
    get completedAt() {
        return this._completedAt;
    }
    get createdBy() {
        return this._createdBy;
    }
    get cancelledBy() {
        return this._cancelledBy;
    }
    get cancelReason() {
        return this._cancelReason;
    }
    get progressPercentage() {
        if (this._totalRecipients === 0)
            return 0;
        return Math.round(((this._successCount + this._failureCount) / this._totalRecipients) * 100);
    }
    get successRate() {
        const completed = this._successCount + this._failureCount;
        if (completed === 0)
            return 0;
        return Math.round((this._successCount / completed) * 100);
    }
    get createdAt() {
        return this._createdAt;
    }
    get updatedAt() {
        return this._updatedAt;
    }
    // Business methods
    start() {
        if (this._status !== BroadcastStatus.PENDING) {
            throw new Error('Can only start pending broadcasts');
        }
        this._status = BroadcastStatus.IN_PROGRESS;
        this._startedAt = new Date();
        this.updateTimestamp();
    }
    complete() {
        if (this._status !== BroadcastStatus.IN_PROGRESS) {
            throw new Error('Can only complete in-progress broadcasts');
        }
        this._status = BroadcastStatus.COMPLETED;
        this._completedAt = new Date();
        this.calculateAverageDuration();
        this.updateTimestamp();
    }
    cancel(cancelledBy, reason) {
        if (this._status === BroadcastStatus.COMPLETED || this._status === BroadcastStatus.CANCELLED) {
            throw new Error('Cannot cancel completed or already cancelled broadcasts');
        }
        this._status = BroadcastStatus.CANCELLED;
        this._cancelledBy = cancelledBy;
        this._cancelReason = reason;
        this._completedAt = new Date();
        this.updateTimestamp();
    }
    fail(reason) {
        this._status = BroadcastStatus.FAILED;
        if (reason && this._metadata) {
            this._metadata.failureReason = reason;
        }
        this._completedAt = new Date();
        this.updateTimestamp();
    }
    addRecipient(recipient) {
        this._recipients.push(recipient);
        this._totalRecipients++;
        this.updateTimestamp();
    }
    updateRecipientStatus(phoneNumber, status, duration, errorMessage) {
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
        }
        else if ((status === 'failed' || status === 'no_answer') &&
            previousStatus !== 'failed' && previousStatus !== 'no_answer') {
            this._failureCount++;
        }
        this.updateTimestamp();
    }
    calculateAverageDuration() {
        const durations = this._recipients
            .filter(r => r.duration && r.duration > 0)
            .map(r => r.duration);
        if (durations.length > 0) {
            const sum = durations.reduce((acc, d) => acc + d, 0);
            this._averageDuration = Math.round(sum / durations.length);
        }
    }
    // Validation
    validateProps(props) {
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
    updateTimestamp() {
        this._updatedAt = new Date();
    }
    // Business rules
    canBeStarted() {
        return this._status === BroadcastStatus.PENDING;
    }
    canBeCancelled() {
        return this._status !== BroadcastStatus.COMPLETED &&
            this._status !== BroadcastStatus.CANCELLED;
    }
    isScheduled() {
        return !!this._scheduledAt && this._scheduledAt > new Date();
    }
    isActive() {
        return this._status === BroadcastStatus.IN_PROGRESS;
    }
    // Factory method
    static create(props) {
        return new Broadcast(props);
    }
    // Convert to plain object
    toObject() {
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
exports.Broadcast = Broadcast;
//# sourceMappingURL=Broadcast.js.map