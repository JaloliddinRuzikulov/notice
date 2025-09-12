/**
 * Broadcast Mapper
 * Maps between Broadcast Domain Entity and DTOs
 */

import { injectable } from 'tsyringe';
import { Broadcast } from '@/core/domain/entities/Broadcast';

@injectable()
export class BroadcastMapper {
  toDTO(entity: Broadcast): any {
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

  toDomain(dto: any): Broadcast {
    return Broadcast.create({
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

  toDTOList(entities: Broadcast[]): any[] {
    return entities.map(entity => this.toDTO(entity));
  }

  toDomainList(dtos: any[]): Broadcast[] {
    return dtos.map(dto => this.toDomain(dto));
  }

  toSummaryDTO(entity: Broadcast): any {
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

  toStartResponseDTO(entity: Broadcast): any {
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

  toStatusDTO(broadcast: Broadcast, progress?: any, callHistory?: any[]): any {
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
}