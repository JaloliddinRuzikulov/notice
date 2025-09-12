"use strict";
/**
 * Call Mapper
 * Maps between Call Domain Entity and DTOs
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallMapper = void 0;
const tsyringe_1 = require("tsyringe");
let CallMapper = class CallMapper {
    toDTO(entity) {
        return {
            id: entity.id,
            broadcastId: entity.broadcastId,
            employeeId: entity.employeeId,
            phoneNumber: entity.phoneNumber,
            status: entity.status,
            duration: entity.duration,
            startedAt: entity.startedAt,
            endedAt: entity.endedAt,
            attempts: entity.attempts,
            errorMessage: entity.errorMessage,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt
        };
    }
    toDomain(dto) {
        return {
            id: dto.id,
            broadcastId: dto.broadcastId,
            employeeId: dto.employeeId,
            phoneNumber: dto.phoneNumber,
            status: dto.status,
            duration: dto.duration,
            startedAt: dto.startedAt,
            endedAt: dto.endedAt,
            attempts: dto.attempts,
            errorMessage: dto.errorMessage,
            createdAt: dto.createdAt,
            updatedAt: dto.updatedAt
        };
    }
    toDTOList(entities) {
        return entities.map(entity => this.toDTO(entity));
    }
    toDomainList(dtos) {
        return dtos.map(dto => this.toDomain(dto));
    }
    toSummaryDTO(entity) {
        return {
            id: entity.id,
            phoneNumber: entity.phoneNumber,
            status: entity.status,
            duration: entity.duration,
            attempts: entity.attempts,
            createdAt: entity.createdAt
        };
    }
    toHistoryDTO(entity) {
        return {
            id: entity.id,
            broadcastId: entity.broadcastId,
            phoneNumber: entity.phoneNumber,
            status: entity.status,
            duration: entity.duration,
            startedAt: entity.startedAt,
            endedAt: entity.endedAt,
            attempts: entity.attempts,
            errorMessage: entity.errorMessage
        };
    }
};
exports.CallMapper = CallMapper;
exports.CallMapper = CallMapper = __decorate([
    (0, tsyringe_1.injectable)()
], CallMapper);
//# sourceMappingURL=CallMapper.js.map