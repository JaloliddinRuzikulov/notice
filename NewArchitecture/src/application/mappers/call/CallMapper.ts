/**
 * Call Mapper
 * Maps between Call Domain Entity and DTOs
 */

import { injectable } from 'tsyringe';

@injectable()
export class CallMapper {
  toDTO(entity: any): any {
    return {
      id: entity.id,
      broadcastId: entity.broadcastId,
      employeeId: entity.employeeId,
      phoneNumber: entity.phoneNumber,
      status: entity.status,
      duration: entity.duration,
      startedAt: entity.startedAt,
      endedAt: entity.endedAt,
      attempts: entity.attempts,
      errorMessage: entity.errorMessage,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  toDomain(dto: any): any {
    return {
      id: dto.id,
      broadcastId: dto.broadcastId,
      employeeId: dto.employeeId,
      phoneNumber: dto.phoneNumber,
      status: dto.status,
      duration: dto.duration,
      startedAt: dto.startedAt,
      endedAt: dto.endedAt,
      attempts: dto.attempts,
      errorMessage: dto.errorMessage,
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
      phoneNumber: entity.phoneNumber,
      status: entity.status,
      duration: entity.duration,
      attempts: entity.attempts,
      createdAt: entity.createdAt
    };
  }

  toHistoryDTO(entity: any): any {
    return {
      id: entity.id,
      broadcastId: entity.broadcastId,
      phoneNumber: entity.phoneNumber,
      status: entity.status,
      duration: entity.duration,
      startedAt: entity.startedAt,
      endedAt: entity.endedAt,
      attempts: entity.attempts,
      errorMessage: entity.errorMessage
    };
  }

  toHistoryResponseDTO(calls: any[]): any {
    return {
      calls: calls.map(call => this.toHistoryDTO(call)),
      totalCalls: calls.length,
      message: 'Call history retrieved successfully'
    };
  }

  toReportDTO(calls: any[], statistics?: any): any {
    const totalCalls = calls.length;
    const successfulCalls = calls.filter(call => call.status === 'completed').length;
    const failedCalls = calls.filter(call => call.status === 'failed').length;
    const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0);
    const averageDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

    return {
      summary: {
        totalCalls,
        successfulCalls,
        failedCalls,
        successRate: totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0,
        averageDuration
      },
      calls: calls.map(call => this.toHistoryDTO(call)),
      statistics: statistics || null
    };
  }
}