"use strict";
/**
 * Broadcast Mapper
 * Maps between Broadcast Domain Entity and DTOs
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastMapper = void 0;
const tsyringe_1 = require("tsyringe");
const Broadcast_1 = require("@/core/domain/entities/Broadcast");
let BroadcastMapper = class BroadcastMapper {
    toDTO(entity) {
        const data = entity.toObject();
        return {
            id: data.id,
            title: data.title,
            message: data.message,
            audioFileUrl: data.audioFileUrl,
            type: data.type,
            priority: data.priority,
            status: data.status,
            recipients: data.recipients,
            departmentIds: data.departmentIds,
            districtIds: data.districtIds,
            groupIds: data.groupIds,
            scheduledAt: data.scheduledAt,
            startedAt: data.startedAt,
            completedAt: data.completedAt,
            totalRecipients: data.totalRecipients,
            successCount: data.successCount,
            failureCount: data.failureCount,
            averageDuration: data.averageDuration,
            createdBy: data.createdBy,
            cancelledBy: data.cancelledBy,
            cancelReason: data.cancelReason,
            metadata: data.metadata,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            progressPercentage: entity.progressPercentage,
            successRate: entity.successRate
        };
    }
    toDomain(dto) {
        return Broadcast_1.Broadcast.create({
            id: dto.id,
            title: dto.title,
            message: dto.message,
            audioFileUrl: dto.audioFileUrl,
            type: dto.type,
            priority: dto.priority,
            status: dto.status,
            recipients: dto.recipients || [],
            departmentIds: dto.departmentIds,
            districtIds: dto.districtIds,
            groupIds: dto.groupIds,
            scheduledAt: dto.scheduledAt,
            startedAt: dto.startedAt,
            completedAt: dto.completedAt,
            totalRecipients: dto.totalRecipients || 0,
            successCount: dto.successCount || 0,
            failureCount: dto.failureCount || 0,
            averageDuration: dto.averageDuration,
            createdBy: dto.createdBy,
            cancelledBy: dto.cancelledBy,
            cancelReason: dto.cancelReason,
            metadata: dto.metadata,
            createdAt: dto.createdAt,
            updatedAt: dto.updatedAt
        });
    }
    toDTOList(entities) {
        return entities.map(entity => this.toDTO(entity));
    }
    toDomainList(dtos) {
        return dtos.map(dto => this.toDomain(dto));
    }
    toSummaryDTO(entity) {
        const data = entity.toObject();
        return {
            id: data.id,
            title: data.title,
            type: data.type,
            status: data.status,
            totalRecipients: data.totalRecipients,
            successCount: data.successCount,
            failureCount: data.failureCount,
            progressPercentage: entity.progressPercentage,
            successRate: entity.successRate,
            createdAt: data.createdAt,
            startedAt: data.startedAt,
            completedAt: data.completedAt
        };
    }
    toStartResponseDTO(entity) {
        const data = entity.toObject();
        return {
            id: data.id,
            title: data.title,
            status: data.status,
            type: data.type,
            createdAt: data.createdAt,
            message: 'Broadcast started successfully'
        };
    }
    toStatusDTO(broadcast, progress, callHistory) {
        const data = broadcast.toObject();
        return {
            id: data.id,
            title: data.title,
            message: data.message,
            type: data.type,
            status: data.status,
            totalRecipients: data.totalRecipients,
            successCount: data.successCount,
            failureCount: data.failureCount,
            progressPercentage: broadcast.progressPercentage,
            successRate: broadcast.successRate,
            startedAt: data.startedAt,
            completedAt: data.completedAt,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            progress: progress || null,
            callHistory: callHistory || []
        };
    }
};
exports.BroadcastMapper = BroadcastMapper;
exports.BroadcastMapper = BroadcastMapper = __decorate([
    (0, tsyringe_1.injectable)()
], BroadcastMapper);
//# sourceMappingURL=BroadcastMapper.js.map