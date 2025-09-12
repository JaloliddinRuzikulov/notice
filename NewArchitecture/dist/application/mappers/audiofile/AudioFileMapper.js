"use strict";
/**
 * AudioFile Mapper
 * Maps between AudioFile Domain Entity and DTOs
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioFileMapper = void 0;
const tsyringe_1 = require("tsyringe");
let AudioFileMapper = class AudioFileMapper {
    toDTO(entity) {
        return {
            id: entity.id,
            filename: entity.filename,
            originalname: entity.originalname,
            mimetype: entity.mimetype,
            size: entity.size,
            path: entity.path,
            url: entity.url,
            duration: entity.duration,
            createdBy: entity.createdBy,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt
        };
    }
    toDomain(dto) {
        return {
            id: dto.id,
            filename: dto.filename,
            originalname: dto.originalname,
            mimetype: dto.mimetype,
            size: dto.size,
            path: dto.path,
            url: dto.url,
            duration: dto.duration,
            createdBy: dto.createdBy,
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
            filename: entity.filename,
            originalname: entity.originalname,
            mimetype: entity.mimetype,
            size: entity.size,
            duration: entity.duration,
            createdAt: entity.createdAt
        };
    }
    toUploadResponseDTO(entity) {
        return {
            id: entity.id,
            filename: entity.filename,
            url: entity.url,
            size: entity.size,
            duration: entity.duration,
            message: 'Audio file uploaded successfully'
        };
    }
};
exports.AudioFileMapper = AudioFileMapper;
exports.AudioFileMapper = AudioFileMapper = __decorate([
    (0, tsyringe_1.injectable)()
], AudioFileMapper);
//# sourceMappingURL=AudioFileMapper.js.map