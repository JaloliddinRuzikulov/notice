"use strict";
/**
 * User Mapper
 * Maps between User Domain Entity and DTOs
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMapper = void 0;
const tsyringe_1 = require("tsyringe");
const User_1 = require("@/core/domain/entities/User");
let UserMapper = class UserMapper {
    toDTO(entity) {
        const data = entity.toObject();
        return {
            id: data.id,
            username: data.username,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
            district: data.district,
            department: data.department,
            permissions: data.permissions || [],
            status: data.status,
            lastLoginAt: data.lastLoginAt,
            lastLoginIp: data.lastLoginIp,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        };
    }
    toDomain(dto) {
        return User_1.User.create({
            id: dto.id,
            username: dto.username,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: dto.role,
            district: dto.district,
            department: dto.department,
            permissions: dto.permissions,
            status: dto.status,
            lastLoginAt: dto.lastLoginAt,
            lastLoginIp: dto.lastLoginIp,
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
    toProfileDTO(entity) {
        const data = entity.toObject();
        return {
            id: data.id,
            username: data.username,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
            district: data.district,
            department: data.department,
            permissions: data.permissions || [],
            status: data.status,
            createdAt: data.createdAt,
            lastLoginAt: data.lastLoginAt,
            lastLoginIp: data.lastLoginIp
        };
    }
};
exports.UserMapper = UserMapper;
exports.UserMapper = UserMapper = __decorate([
    (0, tsyringe_1.injectable)()
], UserMapper);
//# sourceMappingURL=UserMapper.js.map