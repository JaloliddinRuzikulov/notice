"use strict";
/**
 * SIP Account Data Transfer Objects
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SIPAccountDTO = void 0;
const BaseDTO_1 = require("../base/BaseDTO");
const SIPAccount_1 = require("@/core/domain/entities/SIPAccount");
class SIPAccountDTO extends BaseDTO_1.BaseDTO {
    extension;
    password;
    employeeId;
    employeeName;
    status;
    lastRegistered;
    ipAddress;
    userAgent;
    isActive;
    constructor(data) {
        super({
            id: data.id,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        });
        this.extension = data.extension;
        this.password = data.password;
        this.employeeId = data.employeeId;
        this.employeeName = data.employeeName;
        this.status = data.status;
        this.lastRegistered = data.lastRegistered;
        this.ipAddress = data.ipAddress;
        this.userAgent = data.userAgent;
        this.isActive = data.isActive;
    }
    get isOnline() {
        return this.status === SIPAccount_1.SIPAccountStatus.REGISTERED;
    }
    get isAssigned() {
        return !!this.employeeId;
    }
    get lastSeenAgo() {
        if (!this.lastRegistered)
            return null;
        const now = new Date();
        const diff = now.getTime() - this.lastRegistered.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        if (minutes < 1)
            return 'Just now';
        if (minutes < 60)
            return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24)
            return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }
}
exports.SIPAccountDTO = SIPAccountDTO;
//# sourceMappingURL=SIPAccountDTO.js.map