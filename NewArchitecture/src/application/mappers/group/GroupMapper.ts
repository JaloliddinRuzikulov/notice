/**
 * Group Mapper
 * Maps between Group Domain Entity and DTOs
 */

import { injectable } from 'tsyringe';

@injectable()
export class GroupMapper {
  toDTO(entity: any): any {
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

  toDomain(dto: any): any {
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

  toDTOList(entities: any[]): any[] {
    return entities.map(entity => this.toDTO(entity));
  }

  toDomainList(dtos: any[]): any[] {
    return dtos.map(dto => this.toDomain(dto));
  }

  toSummaryDTO(entity: any): any {
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

  toCreateResponseDTO(entity: any): any {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      type: entity.type,
      memberCount: entity.memberIds ? entity.memberIds.length : 0,
      message: 'Group created successfully'
    };
  }

  toUpdateResponseDTO(entity: any): any {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      type: entity.type,
      memberCount: entity.memberIds ? entity.memberIds.length : 0,
      message: 'Group updated successfully'
    };
  }

  validateEmployeeIds(employeeIds: string[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(employeeIds)) {
      errors.push('Employee IDs must be an array');
      return { isValid: false, errors };
    }

    if (employeeIds.length === 0) {
      errors.push('At least one employee ID is required');
      return { isValid: false, errors };
    }

    // Check for duplicates
    const uniqueIds = new Set(employeeIds);
    if (uniqueIds.size !== employeeIds.length) {
      errors.push('Duplicate employee IDs are not allowed');
    }

    // Validate each ID format (basic validation)
    employeeIds.forEach((id, index) => {
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        errors.push(`Invalid employee ID at position ${index + 1}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toStatisticsDTO(groups: any[], totalEmployees?: number): any {
    const totalGroups = groups.length;
    const activeGroups = groups.filter(group => group.isActive).length;
    const averageGroupSize = totalGroups > 0 
      ? Math.round(groups.reduce((sum, group) => sum + (group.memberIds?.length || 0), 0) / totalGroups) 
      : 0;

    return {
      totalGroups,
      activeGroups,
      inactiveGroups: totalGroups - activeGroups,
      averageGroupSize,
      totalEmployeesInGroups: totalEmployees || groups.reduce((sum, group) => sum + (group.memberIds?.length || 0), 0),
      groupTypes: this.getGroupTypeStatistics(groups)
    };
  }

  private getGroupTypeStatistics(groups: any[]): Record<string, number> {
    const typeCount: Record<string, number> = {};
    
    groups.forEach(group => {
      const type = group.type || 'unknown';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    return typeCount;
  }
}