"use strict";
/**
 * User Entity for TypeORM
 * Maps User domain entity to database table
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEntity = exports.UserStatusDB = exports.UserRoleDB = void 0;
const typeorm_1 = require("typeorm");
var UserRoleDB;
(function (UserRoleDB) {
    UserRoleDB["ADMIN"] = "admin";
    UserRoleDB["OPERATOR"] = "operator";
    UserRoleDB["VIEWER"] = "viewer";
    UserRoleDB["DISTRICT_ADMIN"] = "district_admin";
})(UserRoleDB || (exports.UserRoleDB = UserRoleDB = {}));
var UserStatusDB;
(function (UserStatusDB) {
    UserStatusDB["ACTIVE"] = "active";
    UserStatusDB["INACTIVE"] = "inactive";
    UserStatusDB["SUSPENDED"] = "suspended";
    UserStatusDB["PENDING"] = "pending";
})(UserStatusDB || (exports.UserStatusDB = UserStatusDB = {}));
let UserEntity = class UserEntity {
    id;
    username;
    email;
    passwordHash;
    firstName;
    lastName;
    middleName;
    role;
    status;
    district;
    department;
    phoneNumber;
    // Authentication tracking
    lastLoginAt;
    lastLoginIp;
    failedLoginAttempts;
    lockedUntil;
    // Permissions as JSON array
    permissions;
    // Metadata
    metadata;
    // Timestamps
    createdAt;
    updatedAt;
    // Soft delete support
    deletedAt;
    // Session tracking
    currentSessionId;
    sessionExpiresAt;
    // Password reset
    resetPasswordToken;
    resetPasswordExpires;
    // Email verification
    emailVerified;
    emailVerificationToken;
    // Two-factor authentication
    twoFactorEnabled;
    twoFactorSecret;
    // Validation
    normalizeData() {
        if (this.username) {
            this.username = this.username.toLowerCase();
        }
        if (this.email) {
            this.email = this.email.toLowerCase();
        }
    }
    validateEmail() {
        if (this.email && !this.isValidEmail(this.email)) {
            throw new Error(`Invalid email format: ${this.email}`);
        }
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
};
exports.UserEntity = UserEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, unique: true }),
    __metadata("design:type", String)
], UserEntity.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], UserEntity.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], UserEntity.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], UserEntity.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], UserEntity.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], UserEntity.prototype, "middleName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: UserRoleDB,
        default: UserRoleDB.OPERATOR
    }),
    __metadata("design:type", String)
], UserEntity.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: UserStatusDB,
        default: UserStatusDB.PENDING
    }),
    __metadata("design:type", String)
], UserEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], UserEntity.prototype, "district", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], UserEntity.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], UserEntity.prototype, "phoneNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], UserEntity.prototype, "lastLoginAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 45, nullable: true }),
    __metadata("design:type", String)
], UserEntity.prototype, "lastLoginIp", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], UserEntity.prototype, "failedLoginAttempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], UserEntity.prototype, "lockedUntil", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], UserEntity.prototype, "permissions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], UserEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], UserEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], UserEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], UserEntity.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], UserEntity.prototype, "currentSessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], UserEntity.prototype, "sessionExpiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], UserEntity.prototype, "resetPasswordToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], UserEntity.prototype, "resetPasswordExpires", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], UserEntity.prototype, "emailVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], UserEntity.prototype, "emailVerificationToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], UserEntity.prototype, "twoFactorEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], UserEntity.prototype, "twoFactorSecret", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    (0, typeorm_1.BeforeUpdate)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UserEntity.prototype, "normalizeData", null);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    (0, typeorm_1.BeforeUpdate)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UserEntity.prototype, "validateEmail", null);
exports.UserEntity = UserEntity = __decorate([
    (0, typeorm_1.Entity)('users'),
    (0, typeorm_1.Index)(['username'], { unique: true }),
    (0, typeorm_1.Index)(['email'], { unique: true, where: 'email IS NOT NULL' }),
    (0, typeorm_1.Index)(['role']),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['district'])
], UserEntity);
//# sourceMappingURL=UserEntity.js.map