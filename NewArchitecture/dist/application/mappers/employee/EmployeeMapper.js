"use strict";
/**
 * Employee Mapper
 * Maps between Employee Domain Entity and DTOs
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeMapper = void 0;
const tsyringe_1 = require("tsyringe");
const Employee_1 = require("@/core/domain/entities/Employee");
let EmployeeMapper = class EmployeeMapper {
    toDTO(entity) {
        const data = entity.toObject();
        return {
            id: data.id,
            firstName: data.firstName,
            lastName: data.lastName,
            middleName: data.middleName,
            fullName: entity.fullName,
            phoneNumber: data.phoneNumber,
            additionalPhone: data.additionalPhone,
            department: data.department,
            district: data.district,
            position: data.position,
            rank: data.rank,
            notes: data.notes,
            photoUrl: data.photoUrl,
            isActive: data.isActive,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        };
    }
    toDomain(dto) {
        return Employee_1.Employee.create({
            id: dto.id,
            firstName: dto.firstName,
            lastName: dto.lastName,
            middleName: dto.middleName,
            phoneNumber: dto.phoneNumber,
            additionalPhone: dto.additionalPhone,
            department: dto.department,
            district: dto.district,
            position: dto.position,
            rank: dto.rank,
            notes: dto.notes,
            photoUrl: dto.photoUrl,
            isActive: dto.isActive,
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
};
exports.EmployeeMapper = EmployeeMapper;
exports.EmployeeMapper = EmployeeMapper = __decorate([
    (0, tsyringe_1.injectable)()
], EmployeeMapper);
//# sourceMappingURL=EmployeeMapper.js.map