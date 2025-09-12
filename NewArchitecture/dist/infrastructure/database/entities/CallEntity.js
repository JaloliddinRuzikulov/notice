"use strict";
/**
 * Call Entity for TypeORM
 * Maps Call domain entity to database table
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
exports.CallEntity = exports.CallTypeDB = exports.CallDirectionDB = exports.CallStatusDB = void 0;
const typeorm_1 = require("typeorm");
const BroadcastEntity_1 = require("./BroadcastEntity");
const EmployeeEntity_1 = require("./EmployeeEntity");
const AudioFileEntity_1 = require("./AudioFileEntity");
var CallStatusDB;
(function (CallStatusDB) {
    CallStatusDB["INITIATED"] = "initiated";
    CallStatusDB["RINGING"] = "ringing";
    CallStatusDB["ANSWERED"] = "answered";
    CallStatusDB["COMPLETED"] = "completed";
    CallStatusDB["FAILED"] = "failed";
    CallStatusDB["BUSY"] = "busy";
    CallStatusDB["NO_ANSWER"] = "no_answer";
    CallStatusDB["CANCELLED"] = "cancelled";
})(CallStatusDB || (exports.CallStatusDB = CallStatusDB = {}));
var CallDirectionDB;
(function (CallDirectionDB) {
    CallDirectionDB["INBOUND"] = "inbound";
    CallDirectionDB["OUTBOUND"] = "outbound";
})(CallDirectionDB || (exports.CallDirectionDB = CallDirectionDB = {}));
var CallTypeDB;
(function (CallTypeDB) {
    CallTypeDB["BROADCAST"] = "broadcast";
    CallTypeDB["DIRECT"] = "direct";
    CallTypeDB["EMERGENCY"] = "emergency";
    CallTypeDB["TEST"] = "test";
})(CallTypeDB || (exports.CallTypeDB = CallTypeDB = {}));
let CallEntity = class CallEntity {
    id;
    callId; // SIP Call-ID
    from;
    to;
    direction;
    type;
    status;
    // Relations
    broadcastId;
    broadcast;
    employeeId;
    employee;
    // SIP Extension
    sipExtension;
    // Timestamps
    startTime;
    answerTime;
    endTime;
    duration; // seconds
    // Recording
    recordingId;
    recording;
    recordingUrl;
    // DTMF
    dtmfInput;
    // Error tracking
    failureReason;
    // Metadata
    metadata;
    // Timestamps
    createdAt;
    updatedAt;
    // Call quality metrics
    jitter; // milliseconds
    packetLoss; // percentage
    latency; // milliseconds
    // Billing
    cost;
    currency;
};
exports.CallEntity = CallEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CallEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], CallEntity.prototype, "callId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], CallEntity.prototype, "from", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], CallEntity.prototype, "to", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CallDirectionDB,
        default: CallDirectionDB.OUTBOUND
    }),
    __metadata("design:type", String)
], CallEntity.prototype, "direction", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CallTypeDB,
        default: CallTypeDB.DIRECT
    }),
    __metadata("design:type", String)
], CallEntity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CallStatusDB,
        default: CallStatusDB.INITIATED
    }),
    __metadata("design:type", String)
], CallEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CallEntity.prototype, "broadcastId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => BroadcastEntity_1.BroadcastEntity, broadcast => broadcast.calls, { eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'broadcastId' }),
    __metadata("design:type", BroadcastEntity_1.BroadcastEntity)
], CallEntity.prototype, "broadcast", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CallEntity.prototype, "employeeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => EmployeeEntity_1.EmployeeEntity, { eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'employeeId' }),
    __metadata("design:type", EmployeeEntity_1.EmployeeEntity)
], CallEntity.prototype, "employee", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], CallEntity.prototype, "sipExtension", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], CallEntity.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], CallEntity.prototype, "answerTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], CallEntity.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], CallEntity.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CallEntity.prototype, "recordingId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => AudioFileEntity_1.AudioFileEntity, { eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'recordingId' }),
    __metadata("design:type", AudioFileEntity_1.AudioFileEntity)
], CallEntity.prototype, "recording", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], CallEntity.prototype, "recordingUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], CallEntity.prototype, "dtmfInput", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CallEntity.prototype, "failureReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], CallEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CallEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CallEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], CallEntity.prototype, "jitter", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], CallEntity.prototype, "packetLoss", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], CallEntity.prototype, "latency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], CallEntity.prototype, "cost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: true }),
    __metadata("design:type", String)
], CallEntity.prototype, "currency", void 0);
exports.CallEntity = CallEntity = __decorate([
    (0, typeorm_1.Entity)('calls'),
    (0, typeorm_1.Index)(['callId'], { unique: true }),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['broadcastId']),
    (0, typeorm_1.Index)(['employeeId']),
    (0, typeorm_1.Index)(['startTime']),
    (0, typeorm_1.Index)(['from', 'to'])
], CallEntity);
//# sourceMappingURL=CallEntity.js.map