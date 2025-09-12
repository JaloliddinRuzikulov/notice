"use strict";
/**
 * SIPAccount Entity for TypeORM
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
exports.SIPAccountEntity = exports.SIPTransportDB = exports.SIPAccountStatusDB = void 0;
const typeorm_1 = require("typeorm");
var SIPAccountStatusDB;
(function (SIPAccountStatusDB) {
    SIPAccountStatusDB["REGISTERED"] = "registered";
    SIPAccountStatusDB["UNREGISTERED"] = "unregistered";
    SIPAccountStatusDB["REGISTERING"] = "registering";
    SIPAccountStatusDB["FAILED"] = "failed";
    SIPAccountStatusDB["SUSPENDED"] = "suspended";
})(SIPAccountStatusDB || (exports.SIPAccountStatusDB = SIPAccountStatusDB = {}));
var SIPTransportDB;
(function (SIPTransportDB) {
    SIPTransportDB["UDP"] = "udp";
    SIPTransportDB["TCP"] = "tcp";
    SIPTransportDB["TLS"] = "tls";
    SIPTransportDB["WS"] = "ws";
    SIPTransportDB["WSS"] = "wss";
})(SIPTransportDB || (exports.SIPTransportDB = SIPTransportDB = {}));
let SIPAccountEntity = class SIPAccountEntity {
    id;
    extension;
    username;
    password; // encrypted
    domain;
    proxy;
    port;
    transport;
    status;
    displayName;
    isDefault;
    isActive;
    lastRegisteredAt;
    lastRegisteredIp;
    registrationExpires;
    maxConcurrentCalls;
    currentActiveCalls;
    totalCallsMade;
    totalCallsReceived;
    metadata;
    createdAt;
    updatedAt;
};
exports.SIPAccountEntity = SIPAccountEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SIPAccountEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, unique: true }),
    __metadata("design:type", String)
], SIPAccountEntity.prototype, "extension", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], SIPAccountEntity.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], SIPAccountEntity.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], SIPAccountEntity.prototype, "domain", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], SIPAccountEntity.prototype, "proxy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 5060 }),
    __metadata("design:type", Number)
], SIPAccountEntity.prototype, "port", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: SIPTransportDB,
        default: SIPTransportDB.UDP
    }),
    __metadata("design:type", String)
], SIPAccountEntity.prototype, "transport", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: SIPAccountStatusDB,
        default: SIPAccountStatusDB.UNREGISTERED
    }),
    __metadata("design:type", String)
], SIPAccountEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], SIPAccountEntity.prototype, "displayName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], SIPAccountEntity.prototype, "isDefault", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], SIPAccountEntity.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], SIPAccountEntity.prototype, "lastRegisteredAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 45, nullable: true }),
    __metadata("design:type", String)
], SIPAccountEntity.prototype, "lastRegisteredIp", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 3600 }),
    __metadata("design:type", Number)
], SIPAccountEntity.prototype, "registrationExpires", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 5 }),
    __metadata("design:type", Number)
], SIPAccountEntity.prototype, "maxConcurrentCalls", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SIPAccountEntity.prototype, "currentActiveCalls", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SIPAccountEntity.prototype, "totalCallsMade", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SIPAccountEntity.prototype, "totalCallsReceived", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], SIPAccountEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SIPAccountEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SIPAccountEntity.prototype, "updatedAt", void 0);
exports.SIPAccountEntity = SIPAccountEntity = __decorate([
    (0, typeorm_1.Entity)('sip_accounts'),
    (0, typeorm_1.Index)(['extension'], { unique: true }),
    (0, typeorm_1.Index)(['status'])
], SIPAccountEntity);
//# sourceMappingURL=SIPAccountEntity.js.map