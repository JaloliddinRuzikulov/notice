/**
 * AudioFile Mapper
 * Maps between AudioFile Domain Entity and DTOs
 */

import { injectable } from 'tsyringe';

@injectable()
export class AudioFileMapper {
  toDTO(entity: any): any {
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

  toDomain(dto: any): any {
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

  toDTOList(entities: any[]): any[] {
    return entities.map(entity => this.toDTO(entity));
  }

  toDomainList(dtos: any[]): any[] {
    return dtos.map(dto => this.toDomain(dto));
  }

  toSummaryDTO(entity: any): any {
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

  toUploadResponseDTO(entity: any): any {
    return {
      id: entity.id,
      filename: entity.filename,
      url: entity.url,
      size: entity.size,
      duration: entity.duration,
      message: 'Audio file uploaded successfully'
    };
  }

  validateAudioFile(file: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!file) {
      errors.push('Audio file is required');
      return { isValid: false, errors };
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      errors.push('File size exceeds 50MB limit');
    }

    // Check file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/m4a'];
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push('Invalid file type. Supported types: MP3, WAV, OGG, M4A');
    }

    // Check filename
    if (!file.originalname || file.originalname.trim().length === 0) {
      errors.push('Filename is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}