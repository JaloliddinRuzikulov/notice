"use strict";
/**
 * User Data Transfer Objects
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDTO = void 0;
const BaseDTO_1 = require("../base/BaseDTO");
const User_1 = require("@/core/domain/entities/User");
class UserDTO extends BaseDTO_1.BaseDTO {
    username;
    firstName;
    lastName;
    role;
    district;
    department;
    permissions;
    status;
    lastLogin;
    lastLoginIP;
    failedLoginAttempts;
    lockedUntil;
    constructor(data) {
        super({
            id: data.id,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        });
        this.username = data.username;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.role = data.role;
        this.district = data.district;
        this.department = data.department;
        this.permissions = data.permissions;
        this.status = data.status;
        this.lastLogin = data.lastLogin;
        this.lastLoginIP = data.lastLoginIP;
        this.failedLoginAttempts = data.failedLoginAttempts;
        this.lockedUntil = data.lockedUntil;
    }
    get fullName() {
        return `${this.firstName} ${this.lastName}`;
    }
    get isLocked() {
        return !!(this.lockedUntil && this.lockedUntil > new Date());
    }
    get isActive() {
        return this.status === User_1.UserStatus.ACTIVE;
    }
}
exports.UserDTO = UserDTO;
//# sourceMappingURL=UserDTO.js.map