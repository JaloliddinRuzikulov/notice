"use strict";
/**
 * Call Data Transfer Objects
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallDTO = void 0;
const BaseDTO_1 = require("../base/BaseDTO");
const Call_1 = require("@/core/domain/entities/Call");
class CallDTO extends BaseDTO_1.BaseDTO {
    employeeId;
    employeeName;
    phoneNumber;
    broadcastId;
    broadcastName;
    startTime;
    endTime;
    status;
    duration;
    callerId;
    notes;
    constructor(data) {
        super({
            id: data.id,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        });
        this.employeeId = data.employeeId;
        this.employeeName = data.employeeName;
        this.phoneNumber = data.phoneNumber;
        this.broadcastId = data.broadcastId;
        this.broadcastName = data.broadcastName;
        this.startTime = data.startTime;
        this.endTime = data.endTime;
        this.status = data.status;
        this.duration = data.duration;
        this.callerId = data.callerId;
        this.notes = data.notes;
    }
    get isCompleted() {
        return this.status === Call_1.CallStatus.COMPLETED;
    }
    get isFailed() {
        return this.status === Call_1.CallStatus.FAILED;
    }
    get formattedDuration() {
        if (this.duration < 60) {
            return `${this.duration}s`;
        }
        const minutes = Math.floor(this.duration / 60);
        const seconds = this.duration % 60;
        return `${minutes}m ${seconds}s`;
    }
}
exports.CallDTO = CallDTO;
//# sourceMappingURL=CallDTO.js.map