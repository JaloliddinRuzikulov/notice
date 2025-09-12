"use strict";
/**
 * Broadcast Entity for TypeORM
 * Maps Broadcast domain entity to database table
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
exports.BroadcastEntity = exports.BroadcastPriorityDB = exports.BroadcastTypeDB = exports.BroadcastStatusDB = void 0;
const typeorm_1 = require("typeorm");
const UserEntity_1 = require("./UserEntity");
const CallEntity_1 = require("./CallEntity");
const AudioFileEntity_1 = require("./AudioFileEntity");
var BroadcastStatusDB;
(function (BroadcastStatusDB) {
    BroadcastStatusDB["PENDING"] = "pending";
    BroadcastStatusDB["IN_PROGRESS"] = "in_progress";
    BroadcastStatusDB["COMPLETED"] = "completed";
    BroadcastStatusDB["CANCELLED"] = "cancelled";
    BroadcastStatusDB["FAILED"] = "failed";
})(BroadcastStatusDB || (exports.BroadcastStatusDB = BroadcastStatusDB = {}));
var BroadcastTypeDB;
(function (BroadcastTypeDB) {
    BroadcastTypeDB["VOICE"] = "voice";
    BroadcastTypeDB["SMS"] = "sms";
    BroadcastTypeDB["BOTH"] = "both";
})(BroadcastTypeDB || (exports.BroadcastTypeDB = BroadcastTypeDB = {}));
var BroadcastPriorityDB;
(function (BroadcastPriorityDB) {
    BroadcastPriorityDB["LOW"] = "low";
    BroadcastPriorityDB["NORMAL"] = "normal";
    BroadcastPriorityDB["HIGH"] = "high";
    BroadcastPriorityDB["URGENT"] = "urgent";
})(BroadcastPriorityDB || (exports.BroadcastPriorityDB = BroadcastPriorityDB = {}));
let BroadcastEntity = class BroadcastEntity {
    id;
    title;
    message;
    type;
    priority;
    status;
    // Recipients as JSON
    recipients;
    // Target groups
    departmentIds;
    districtIds;
    groupIds;
    // Scheduling
    scheduledAt;
    startedAt;
    completedAt;
    // Statistics
    totalRecipients;
    successCount;
    failureCount;
    averageDuration;
    // Relations
    createdBy;
    creator;
    cancelledBy;
    canceller;
    cancelReason;
    // Audio file relation
    audioFileId;
    audioFile;
    audioFileUrl;
    // Calls relation
    calls;
    // Metadata
    metadata;
    // Timestamps
    createdAt;
    updatedAt;
    // Retry configuration
    maxRetries;
    retryDelay; // seconds
    // Call configuration
    callTimeout; // seconds
    maxConcurrentCalls;
    // Progress tracking
    processedCount;
    pendingCount;
    inProgressCount;
};
exports.BroadcastEntity = BroadcastEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BroadcastEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], BroadcastEntity.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], BroadcastEntity.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: BroadcastTypeDB,
        default: BroadcastTypeDB.VOICE
    }),
    __metadata("design:type", String)
], BroadcastEntity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: BroadcastPriorityDB,
        default: BroadcastPriorityDB.NORMAL
    }),
    __metadata("design:type", String)
], BroadcastEntity.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: BroadcastStatusDB,
        default: BroadcastStatusDB.PENDING
    }),
    __metadata("design:type", String)
], BroadcastEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json' }),
    __metadata("design:type", Array)
], BroadcastEntity.prototype, "recipients", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], BroadcastEntity.prototype, "departmentIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], BroadcastEntity.prototype, "districtIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], BroadcastEntity.prototype, "groupIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], BroadcastEntity.prototype, "scheduledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], BroadcastEntity.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], BroadcastEntity.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], BroadcastEntity.prototype, "totalRecipients", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], BroadcastEntity.prototype, "successCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], BroadcastEntity.prototype, "failureCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], BroadcastEntity.prototype, "averageDuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], BroadcastEntity.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserEntity_1.UserEntity, { eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'createdBy' }),
    __metadata("design:type", UserEntity_1.UserEntity)
], BroadcastEntity.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], BroadcastEntity.prototype, "cancelledBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserEntity_1.UserEntity, { eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'cancelledBy' }),
    __metadata("design:type", UserEntity_1.UserEntity)
], BroadcastEntity.prototype, "canceller", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], BroadcastEntity.prototype, "cancelReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], BroadcastEntity.prototype, "audioFileId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => AudioFileEntity_1.AudioFileEntity, { eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'audioFileId' }),
    __metadata("design:type", AudioFileEntity_1.AudioFileEntity)
], BroadcastEntity.prototype, "audioFile", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], BroadcastEntity.prototype, "audioFileUrl", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => CallEntity_1.CallEntity, call => call.broadcast),
    __metadata("design:type", Array)
], BroadcastEntity.prototype, "calls", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], BroadcastEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], BroadcastEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], BroadcastEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 3 }),
    __metadata("design:type", Number)
], BroadcastEntity.prototype, "maxRetries", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 30 }),
    __metadata("design:type", Number)
], BroadcastEntity.prototype, "retryDelay", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 30 }),
    __metadata("design:type", Number)
], BroadcastEntity.prototype, "callTimeout", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 5 }),
    __metadata("design:type", Number)
], BroadcastEntity.prototype, "maxConcurrentCalls", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], BroadcastEntity.prototype, "processedCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], BroadcastEntity.prototype, "pendingCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], BroadcastEntity.prototype, "inProgressCount", void 0);
exports.BroadcastEntity = BroadcastEntity = __decorate([
    (0, typeorm_1.Entity)('broadcasts'),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['priority']),
    (0, typeorm_1.Index)(['createdBy']),
    (0, typeorm_1.Index)(['scheduledAt']),
    (0, typeorm_1.Index)(['createdAt'])
], BroadcastEntity);
//# sourceMappingURL=BroadcastEntity.js.map