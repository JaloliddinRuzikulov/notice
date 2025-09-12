/**
 * User Mapper
 * Maps between User Domain Entity and DTOs
 */

import { injectable } from 'tsyringe';
import { User } from '@/core/domain/entities/User';

@injectable()
export class UserMapper {
  toDTO(entity: User): any {
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

  toDomain(dto: any): User {
    return User.create({
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

  toDTOList(entities: User[]): any[] {
    return entities.map(entity => this.toDTO(entity));
  }

  toDomainList(dtos: any[]): User[] {
    return dtos.map(dto => this.toDomain(dto));
  }

  toProfileDTO(entity: User): any {
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
}