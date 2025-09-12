"use strict";
/**
 * Group Mapper
 * Maps between Group Domain Entity and DTOs
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupMapper = void 0;
const tsyringe_1 = require("tsyringe");
let GroupMapper = class GroupMapper {
    toDTO(entity) {
        return {
            id: entity.id,
            name: entity.name,
            description: entity.description,
            type: entity.type,
            memberIds: entity.memberIds,
            createdBy: entity.createdBy,
            isActive: entity.isActive,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt
        };
    }
    toDomain(dto) {
        return {
            id: dto.id,
            name: dto.name,
            description: dto.description,
            type: dto.type,
            memberIds: dto.memberIds || [],
            createdBy: dto.createdBy,
            isActive: dto.isActive,
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
            name: entity.name,
            description: entity.description,
            type: entity.type,
            memberCount: entity.memberIds ? entity.memberIds.length : 0,
            isActive: entity.isActive,
            createdAt: entity.createdAt
        };
    }
    toCreateResponseDTO(entity) {
        return {
            id: entity.id,
            name: entity.name,
            description: entity.description,
            type: entity.type,
            memberCount: entity.memberIds ? entity.memberIds.length : 0,
            message: 'Group created successfully'
        };
    }
    toUpdateResponseDTO(entity) {
        return {
            id: entity.id,
            name: entity.name,
            description: entity.description,
            type: entity.type,
            memberCount: entity.memberIds ? entity.memberIds.length : 0,
            message: 'Group updated successfully'
        };
    }
};
exports.GroupMapper = GroupMapper;
exports.GroupMapper = GroupMapper = __decorate([
    (0, tsyringe_1.injectable)()
], GroupMapper);
//# sourceMappingURL=GroupMapper.js.map