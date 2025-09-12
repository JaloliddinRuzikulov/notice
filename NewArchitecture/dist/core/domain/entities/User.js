"use strict";
/**
 * User Domain Entity
 * Represents system users with authentication and authorization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["OPERATOR"] = "operator";
    UserRole["VIEWER"] = "viewer";
    UserRole["DISTRICT_ADMIN"] = "district_admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["INACTIVE"] = "inactive";
    UserStatus["SUSPENDED"] = "suspended";
    UserStatus["PENDING"] = "pending";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
class User {
    _id;
    _username;
    _email;
    _passwordHash;
    _firstName;
    _lastName;
    _middleName;
    _role;
    _status;
    _district;
    _department;
    _phoneNumber;
    _lastLoginAt;
    _lastLoginIp;
    _failedLoginAttempts;
    _lockedUntil;
    _permissions;
    _metadata;
    _createdAt;
    _updatedAt;
    constructor(props) {
        this.validateProps(props);
        this._id = props.id;
        this._username = props.username.toLowerCase();
        this._email = props.email?.toLowerCase();
        this._passwordHash = props.passwordHash;
        this._firstName = props.firstName;
        this._lastName = props.lastName;
        this._middleName = props.middleName;
        this._role = props.role;
        this._status = props.status;
        this._district = props.district;
        this._department = props.department;
        this._phoneNumber = props.phoneNumber;
        this._lastLoginAt = props.lastLoginAt;
        this._lastLoginIp = props.lastLoginIp;
        this._failedLoginAttempts = props.failedLoginAttempts ?? 0;
        this._lockedUntil = props.lockedUntil;
        this._permissions = props.permissions ?? [];
        this._metadata = props.metadata;
        this._createdAt = props.createdAt || new Date();
        this._updatedAt = props.updatedAt || new Date();
    }
    // Getters
    get id() {
        return this._id;
    }
    get username() {
        return this._username;
    }
    get email() {
        return this._email;
    }
    get passwordHash() {
        return this._passwordHash;
    }
    get firstName() {
        return this._firstName;
    }
    get lastName() {
        return this._lastName;
    }
    get middleName() {
        return this._middleName;
    }
    get fullName() {
        const parts = [this._firstName, this._lastName];
        if (this._middleName) {
            parts.push(this._middleName);
        }
        return parts.join(' ');
    }
    get role() {
        return this._role;
    }
    get status() {
        return this._status;
    }
    get district() {
        return this._district;
    }
    get department() {
        return this._department;
    }
    get phoneNumber() {
        return this._phoneNumber;
    }
    get lastLoginAt() {
        return this._lastLoginAt;
    }
    get lastLoginIp() {
        return this._lastLoginIp;
    }
    get failedLoginAttempts() {
        return this._failedLoginAttempts;
    }
    get lockedUntil() {
        return this._lockedUntil;
    }
    get permissions() {
        return this._permissions;
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
    updatePassword(passwordHash) {
        this._passwordHash = passwordHash;
        this._failedLoginAttempts = 0;
        this._lockedUntil = undefined;
        this.updateTimestamp();
    }
    recordSuccessfulLogin(ipAddress) {
        this._lastLoginAt = new Date();
        this._lastLoginIp = ipAddress;
        this._failedLoginAttempts = 0;
        this._lockedUntil = undefined;
        this.updateTimestamp();
    }
    recordFailedLogin() {
        this._failedLoginAttempts++;
        // Lock account after 5 failed attempts for 30 minutes
        if (this._failedLoginAttempts >= 5) {
            const lockDuration = 30 * 60 * 1000; // 30 minutes
            this._lockedUntil = new Date(Date.now() + lockDuration);
            this._status = UserStatus.SUSPENDED;
        }
        this.updateTimestamp();
    }
    unlock() {
        this._failedLoginAttempts = 0;
        this._lockedUntil = undefined;
        if (this._status === UserStatus.SUSPENDED) {
            this._status = UserStatus.ACTIVE;
        }
        this.updateTimestamp();
    }
    changeRole(role) {
        this._role = role;
        this.updateTimestamp();
    }
    changeStatus(status) {
        this._status = status;
        this.updateTimestamp();
    }
    activate() {
        this._status = UserStatus.ACTIVE;
        this.updateTimestamp();
    }
    deactivate() {
        this._status = UserStatus.INACTIVE;
        this.updateTimestamp();
    }
    suspend(until) {
        this._status = UserStatus.SUSPENDED;
        if (until) {
            this._lockedUntil = until;
        }
        this.updateTimestamp();
    }
    addPermission(permission) {
        if (!this._permissions.includes(permission)) {
            this._permissions.push(permission);
            this.updateTimestamp();
        }
    }
    removePermission(permission) {
        const index = this._permissions.indexOf(permission);
        if (index > -1) {
            this._permissions.splice(index, 1);
            this.updateTimestamp();
        }
    }
    hasPermission(permission) {
        return this._permissions.includes(permission);
    }
    updateDistrict(district) {
        this._district = district;
        this.updateTimestamp();
    }
    updateDepartment(department) {
        this._department = department;
        this.updateTimestamp();
    }
    updateEmail(email) {
        if (email) {
            this._email = email.toLowerCase();
        }
        else {
            this._email = undefined;
        }
        this.updateTimestamp();
    }
    updatePhoneNumber(phoneNumber) {
        this._phoneNumber = phoneNumber;
        this.updateTimestamp();
    }
    updateMetadata(key, value) {
        if (!this._metadata) {
            this._metadata = {};
        }
        this._metadata[key] = value;
        this.updateTimestamp();
    }
    // Validation
    validateProps(props) {
        if (!props.username || props.username.trim().length < 3) {
            throw new Error('Username must be at least 3 characters');
        }
        if (!props.firstName || props.firstName.trim().length === 0) {
            throw new Error('First name is required');
        }
        if (!props.lastName || props.lastName.trim().length === 0) {
            throw new Error('Last name is required');
        }
        if (props.email && !this.isValidEmail(props.email)) {
            throw new Error('Invalid email format');
        }
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    updateTimestamp() {
        this._updatedAt = new Date();
    }
    // Business rules
    isLocked() {
        if (!this._lockedUntil)
            return false;
        return this._lockedUntil > new Date();
    }
    isAdmin() {
        return this._role === UserRole.ADMIN;
    }
    isDistrictAdmin() {
        return this._role === UserRole.DISTRICT_ADMIN;
    }
    canAccessDistrict(district) {
        if (this.isAdmin())
            return true;
        if (this.isDistrictAdmin() && this._district === district)
            return true;
        return false;
    }
    canManageUsers() {
        return this.isAdmin() || this.hasPermission('manage_users');
    }
    canBroadcast() {
        return this._role !== UserRole.VIEWER || this.hasPermission('broadcast');
    }
    // Factory method
    static create(props) {
        return new User(props);
    }
    // Convert to plain object
    toObject() {
        return {
            id: this._id,
            username: this._username,
            email: this._email,
            passwordHash: this._passwordHash,
            firstName: this._firstName,
            lastName: this._lastName,
            middleName: this._middleName,
            role: this._role,
            status: this._status,
            district: this._district,
            department: this._department,
            phoneNumber: this._phoneNumber,
            lastLoginAt: this._lastLoginAt,
            lastLoginIp: this._lastLoginIp,
            failedLoginAttempts: this._failedLoginAttempts,
            lockedUntil: this._lockedUntil,
            permissions: [...this._permissions],
            metadata: this._metadata ? { ...this._metadata } : undefined,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
        };
    }
}
exports.User = User;
//# sourceMappingURL=User.js.map