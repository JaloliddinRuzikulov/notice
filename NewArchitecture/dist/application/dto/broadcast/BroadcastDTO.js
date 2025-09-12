"use strict";
/**
 * Broadcast Data Transfer Objects
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastDTO = void 0;
const BaseDTO_1 = require("../base/BaseDTO");
const Broadcast_1 = require("@/core/domain/entities/Broadcast");
class BroadcastDTO extends BaseDTO_1.BaseDTO {
    name;
    type;
    audioFileId;
    message;
    targetEmployees;
    targetDepartments;
    targetDistricts;
    scheduledFor;
    startedAt;
    completedAt;
    status;
    progress;
    createdBy;
    notes;
    constructor(data) {
        super({
            id: data.id,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        });
        this.name = data.name;
        this.type = data.type;
        this.audioFileId = data.audioFileId;
        this.message = data.message;
        this.targetEmployees = data.targetEmployees;
        this.targetDepartments = data.targetDepartments;
        this.targetDistricts = data.targetDistricts;
        this.scheduledFor = data.scheduledFor;
        this.startedAt = data.startedAt;
        this.completedAt = data.completedAt;
        this.status = data.status;
        this.progress = data.progress;
        this.createdBy = data.createdBy;
        this.notes = data.notes;
    }
    get isActive() {
        return this.status === Broadcast_1.BroadcastStatus.IN_PROGRESS;
    }
    get isCompleted() {
        return this.status === Broadcast_1.BroadcastStatus.COMPLETED;
    }
    get duration() {
        if (this.startedAt && this.completedAt) {
            return Math.round((this.completedAt.getTime() - this.startedAt.getTime()) / 1000);
        }
        return null;
    }
}
exports.BroadcastDTO = BroadcastDTO;
//# sourceMappingURL=BroadcastDTO.js.map