/**
 * Employee Mapper
 * Maps between Employee Domain Entity and DTOs
 */

import { injectable } from 'tsyringe';
import { Employee } from '@/core/domain/entities/Employee';

@injectable()
export class EmployeeMapper {
  toDTO(entity: Employee): any {
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

  toDomain(dto: any): Employee {
    return Employee.create({
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

  toDTOList(entities: Employee[]): any[] {
    return entities.map(entity => this.toDTO(entity));
  }

  toDomainList(dtos: any[]): Employee[] {
    return dtos.map(dto => this.toDomain(dto));
  }
}