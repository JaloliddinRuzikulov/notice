/**
 * Call Repository Implementation
 * Maps Call domain entity to database operations
 */

import { injectable } from 'tsyringe';
import { Repository, DataSource, LessThan, MoreThan, Between, In } from 'typeorm';
import { ICallRepository, CallSearchCriteria, CallStatistics } from '@/core/domain/repositories/ICallRepository';
import { Call, CallStatus, CallDirection, CallType } from '@/core/domain/entities/Call';
import { CallEntity } from '@/infrastructure/database/entities/CallEntity';
import { DatabaseConnection } from '@/infrastructure/database/connection';

@injectable()
export class CallRepository implements ICallRepository {
  private repository: Repository<CallEntity>;

  constructor() {
    const dataSource: DataSource = DatabaseConnection.getInstance().getDataSource();
    this.repository = dataSource.getRepository(CallEntity);
  }

  // Convert entity to domain
  private toDomain(entity: CallEntity): Call {
    return Call.create({
      id: entity.id,
      callId: entity.callId,
      from: entity.from,
      to: entity.to,
      direction: entity.direction as CallDirection,
      type: entity.type as CallType,
      status: entity.status as CallStatus,
      broadcastId: entity.broadcastId,
      employeeId: entity.employeeId,
      sipExtension: entity.sipExtension,
      startTime: entity.startTime,
      answerTime: entity.answerTime,
      endTime: entity.endTime,
      duration: entity.duration,
      recordingUrl: entity.recordingUrl,
      dtmfInput: entity.dtmfInput,
      failureReason: entity.failureReason,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  // Convert domain to entity
  private toEntity(domain: Call): CallEntity {
    const entity = new CallEntity();
    
    if (domain.id) {
      entity.id = domain.id;
    }
    
    const props = domain.toObject();
    entity.callId = props.callId;
    entity.from = props.from;
    entity.to = props.to;
    entity.direction = props.direction;
    entity.type = props.type;
    entity.status = props.status;
    entity.broadcastId = props.broadcastId;
    entity.employeeId = props.employeeId;
    entity.sipExtension = props.sipExtension;
    entity.startTime = props.startTime;
    entity.answerTime = props.answerTime;
    entity.endTime = props.endTime;
    entity.duration = props.duration;
    entity.recordingUrl = props.recordingUrl;
    entity.dtmfInput = props.dtmfInput;
    entity.failureReason = props.failureReason;
    entity.metadata = props.metadata;
    entity.createdAt = props.createdAt;
    entity.updatedAt = props.updatedAt;

    return entity;
  }

  // Helper method to calculate statistics
  private async calculateStatistics(queryBuilder: any): Promise<CallStatistics> {
    const results = await queryBuilder
      .select([
        'COUNT(*) as totalCalls',
        'COUNT(CASE WHEN status = :answered OR status = :completed THEN 1 END) as answeredCalls',
        'COUNT(CASE WHEN status = :failed THEN 1 END) as failedCalls',
        'COUNT(CASE WHEN status = :busy THEN 1 END) as busyCalls',
        'COUNT(CASE WHEN status = :noAnswer THEN 1 END) as noAnswerCalls',
        'AVG(duration) as averageDuration',
        'AVG(CASE WHEN answerTime IS NOT NULL THEN EXTRACT(EPOCH FROM (answerTime - startTime)) ELSE NULL END) as averageWaitTime',
        'SUM(duration) as totalDuration'
      ])
      .setParameters({
        answered: CallStatus.ANSWERED,
        completed: CallStatus.COMPLETED,
        failed: CallStatus.FAILED,
        busy: CallStatus.BUSY,
        noAnswer: CallStatus.NO_ANSWER
      })
      .getRawOne();

    const totalCalls = parseInt(results.totalCalls) || 0;
    const answeredCalls = parseInt(results.answeredCalls) || 0;

    return {
      totalCalls,
      answeredCalls,
      failedCalls: parseInt(results.failedCalls) || 0,
      busyCalls: parseInt(results.busyCalls) || 0,
      noAnswerCalls: parseInt(results.noAnswerCalls) || 0,
      averageDuration: parseFloat(results.averageDuration) || 0,
      averageWaitTime: parseFloat(results.averageWaitTime) || 0,
      answerRate: totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0,
      totalDuration: parseInt(results.totalDuration) || 0
    };
  }

  // Basic CRUD operations
  async findById(id: string): Promise<Call | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCallId(callId: string): Promise<Call | null> {
    const entity = await this.repository.findOne({ where: { callId } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Call[]> {
    const entities = await this.repository.find();
    return entities.map(entity => this.toDomain(entity));
  }

  async save(call: Call): Promise<Call> {
    const entity = this.toEntity(call);
    const savedEntity = await this.repository.save(entity);
    return this.toDomain(savedEntity);
  }

  async update(id: string, call: Partial<Call>): Promise<Call | null> {
    await this.repository.update(id, call as any);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  // Status management
  async findByStatus(status: CallStatus): Promise<Call[]> {
    const entities = await this.repository.find({ where: { status } });
    return entities.map(entity => this.toDomain(entity));
  }

  async findActive(): Promise<Call[]> {
    const entities = await this.repository.find({ 
      where: { 
        status: In([CallStatus.INITIATED, CallStatus.RINGING, CallStatus.ANSWERED])
      } 
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findCompleted(): Promise<Call[]> {
    return this.findByStatus(CallStatus.COMPLETED);
  }

  async findFailed(): Promise<Call[]> {
    const entities = await this.repository.find({ 
      where: { 
        status: In([CallStatus.FAILED, CallStatus.BUSY, CallStatus.NO_ANSWER])
      } 
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async updateStatus(id: string, status: CallStatus): Promise<boolean> {
    const result = await this.repository.update(id, { status });
    return result.affected ? result.affected > 0 : false;
  }

  // Call lifecycle
  async startCall(call: Call): Promise<Call> {
    const entity = this.toEntity(call);
    entity.status = CallStatus.INITIATED;
    entity.startTime = new Date();
    const savedEntity = await this.repository.save(entity);
    return this.toDomain(savedEntity);
  }

  async answerCall(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { 
      status: CallStatus.ANSWERED,
      answerTime: new Date()
    });
    return result.affected ? result.affected > 0 : false;
  }

  async completeCall(id: string, duration: number): Promise<boolean> {
    const result = await this.repository.update(id, { 
      status: CallStatus.COMPLETED,
      endTime: new Date(),
      duration
    });
    return result.affected ? result.affected > 0 : false;
  }

  async failCall(id: string, reason: string): Promise<boolean> {
    const result = await this.repository.update(id, { 
      status: CallStatus.FAILED,
      failureReason: reason,
      endTime: new Date()
    });
    return result.affected ? result.affected > 0 : false;
  }

  async cancelCall(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { 
      status: CallStatus.CANCELLED,
      endTime: new Date()
    });
    return result.affected ? result.affected > 0 : false;
  }

  // Search and filtering
  async search(criteria: CallSearchCriteria): Promise<Call[]> {
    const queryBuilder = this.repository.createQueryBuilder('call');

    if (criteria.from) {
      queryBuilder.andWhere('call.from LIKE :from', { from: `%${criteria.from}%` });
    }
    if (criteria.to) {
      queryBuilder.andWhere('call.to LIKE :to', { to: `%${criteria.to}%` });
    }
    if (criteria.direction) {
      queryBuilder.andWhere('call.direction = :direction', { direction: criteria.direction });
    }
    if (criteria.type) {
      queryBuilder.andWhere('call.type = :type', { type: criteria.type });
    }
    if (criteria.status) {
      queryBuilder.andWhere('call.status = :status', { status: criteria.status });
    }
    if (criteria.broadcastId) {
      queryBuilder.andWhere('call.broadcastId = :broadcastId', { broadcastId: criteria.broadcastId });
    }
    if (criteria.employeeId) {
      queryBuilder.andWhere('call.employeeId = :employeeId', { employeeId: criteria.employeeId });
    }
    if (criteria.sipExtension) {
      queryBuilder.andWhere('call.sipExtension = :sipExtension', { sipExtension: criteria.sipExtension });
    }
    if (criteria.startDate) {
      queryBuilder.andWhere('call.startTime >= :startDate', { startDate: criteria.startDate });
    }
    if (criteria.endDate) {
      queryBuilder.andWhere('call.startTime <= :endDate', { endDate: criteria.endDate });
    }

    const entities = await queryBuilder.getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Call[]> {
    const entities = await this.repository.createQueryBuilder('call')
      .where('call.from = :phoneNumber OR call.to = :phoneNumber', { phoneNumber })
      .getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  async findByEmployee(employeeId: string): Promise<Call[]> {
    const entities = await this.repository.find({ where: { employeeId } });
    return entities.map(entity => this.toDomain(entity));
  }

  async findByBroadcast(broadcastId: string): Promise<Call[]> {
    const entities = await this.repository.find({ where: { broadcastId } });
    return entities.map(entity => this.toDomain(entity));
  }

  async findBySipExtension(extension: string): Promise<Call[]> {
    const entities = await this.repository.find({ where: { sipExtension: extension } });
    return entities.map(entity => this.toDomain(entity));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Call[]> {
    const entities = await this.repository.find({
      where: {
        startTime: Between(startDate, endDate)
      }
    });
    return entities.map(entity => this.toDomain(entity));
  }

  // Direction and type
  async findInbound(): Promise<Call[]> {
    const entities = await this.repository.find({ where: { direction: CallDirection.INBOUND } });
    return entities.map(entity => this.toDomain(entity));
  }

  async findOutbound(): Promise<Call[]> {
    const entities = await this.repository.find({ where: { direction: CallDirection.OUTBOUND } });
    return entities.map(entity => this.toDomain(entity));
  }

  async findByType(type: CallType): Promise<Call[]> {
    const entities = await this.repository.find({ where: { type } });
    return entities.map(entity => this.toDomain(entity));
  }

  // Recording management
  async updateRecording(id: string, recordingUrl: string): Promise<boolean> {
    const result = await this.repository.update(id, { recordingUrl });
    return result.affected ? result.affected > 0 : false;
  }

  async findWithRecordings(): Promise<Call[]> {
    const entities = await this.repository.createQueryBuilder('call')
      .where('call.recordingUrl IS NOT NULL')
      .andWhere('call.recordingUrl != ""')
      .getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  async findWithoutRecordings(): Promise<Call[]> {
    const entities = await this.repository.createQueryBuilder('call')
      .where('call.recordingUrl IS NULL OR call.recordingUrl = ""')
      .getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  // DTMF management
  async updateDtmfInput(id: string, dtmfInput: string): Promise<boolean> {
    const result = await this.repository.update(id, { dtmfInput });
    return result.affected ? result.affected > 0 : false;
  }

  async findByDtmfInput(dtmfInput: string): Promise<Call[]> {
    const entities = await this.repository.find({ where: { dtmfInput } });
    return entities.map(entity => this.toDomain(entity));
  }

  // Statistics
  async getStatistics(startDate?: Date, endDate?: Date): Promise<CallStatistics> {
    let queryBuilder = this.repository.createQueryBuilder('call');
    
    if (startDate) {
      queryBuilder = queryBuilder.where('call.startTime >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder = queryBuilder.andWhere('call.startTime <= :endDate', { endDate });
    }

    return this.calculateStatistics(queryBuilder);
  }

  async getStatisticsByEmployee(employeeId: string): Promise<CallStatistics> {
    const queryBuilder = this.repository.createQueryBuilder('call')
      .where('call.employeeId = :employeeId', { employeeId });
    return this.calculateStatistics(queryBuilder);
  }

  async getStatisticsByBroadcast(broadcastId: string): Promise<CallStatistics> {
    const queryBuilder = this.repository.createQueryBuilder('call')
      .where('call.broadcastId = :broadcastId', { broadcastId });
    return this.calculateStatistics(queryBuilder);
  }

  async getStatisticsBySipExtension(extension: string): Promise<CallStatistics> {
    const queryBuilder = this.repository.createQueryBuilder('call')
      .where('call.sipExtension = :extension', { extension });
    return this.calculateStatistics(queryBuilder);
  }

  async getDailyStatistics(date: Date): Promise<CallStatistics> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const queryBuilder = this.repository.createQueryBuilder('call')
      .where('call.startTime BETWEEN :startOfDay AND :endOfDay', { startOfDay, endOfDay });
    return this.calculateStatistics(queryBuilder);
  }

  async getHourlyStatistics(date: Date, hour: number): Promise<CallStatistics> {
    const startOfHour = new Date(date);
    startOfHour.setHours(hour, 0, 0, 0);
    const endOfHour = new Date(date);
    endOfHour.setHours(hour, 59, 59, 999);

    const queryBuilder = this.repository.createQueryBuilder('call')
      .where('call.startTime BETWEEN :startOfHour AND :endOfHour', { startOfHour, endOfHour });
    return this.calculateStatistics(queryBuilder);
  }

  // Call history
  async getHistory(limit?: number): Promise<Call[]> {
    let queryBuilder = this.repository.createQueryBuilder('call')
      .orderBy('call.startTime', 'DESC');
    
    if (limit) {
      queryBuilder = queryBuilder.limit(limit);
    }

    const entities = await queryBuilder.getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  async getHistoryByEmployee(employeeId: string, limit?: number): Promise<Call[]> {
    let queryBuilder = this.repository.createQueryBuilder('call')
      .where('call.employeeId = :employeeId', { employeeId })
      .orderBy('call.startTime', 'DESC');
    
    if (limit) {
      queryBuilder = queryBuilder.limit(limit);
    }

    const entities = await queryBuilder.getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  async getHistoryByPhoneNumber(phoneNumber: string, limit?: number): Promise<Call[]> {
    let queryBuilder = this.repository.createQueryBuilder('call')
      .where('call.from = :phoneNumber OR call.to = :phoneNumber', { phoneNumber })
      .orderBy('call.startTime', 'DESC');
    
    if (limit) {
      queryBuilder = queryBuilder.limit(limit);
    }

    const entities = await queryBuilder.getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  // Concurrent calls
  async getActiveCalls(): Promise<Call[]> {
    return this.findActive();
  }

  async getActiveCallCount(): Promise<number> {
    return await this.repository.count({
      where: {
        status: In([CallStatus.INITIATED, CallStatus.RINGING, CallStatus.ANSWERED])
      }
    });
  }

  async getActiveCallsBySipExtension(extension: string): Promise<Call[]> {
    const entities = await this.repository.find({
      where: {
        sipExtension: extension,
        status: In([CallStatus.INITIATED, CallStatus.RINGING, CallStatus.ANSWERED])
      }
    });
    return entities.map(entity => this.toDomain(entity));
  }

  // Bulk operations
  async deleteMany(ids: string[]): Promise<number> {
    const result = await this.repository.delete(ids);
    return result.affected || 0;
  }

  async deleteOldCalls(beforeDate: Date): Promise<number> {
    const result = await this.repository.delete({
      startTime: LessThan(beforeDate)
    });
    return result.affected || 0;
  }

  // Check existence
  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  async existsByCallId(callId: string): Promise<boolean> {
    const count = await this.repository.count({ where: { callId } });
    return count > 0;
  }

  async hasActiveCalls(): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        status: In([CallStatus.INITIATED, CallStatus.RINGING, CallStatus.ANSWERED])
      }
    });
    return count > 0;
  }

  async countTotal(): Promise<number> {
    return await this.repository.count();
  }

  async countActive(): Promise<number> {
    return this.getActiveCallCount();
  }

  // Legacy methods to maintain compatibility with existing code
  async findByBroadcastId(broadcastId: string): Promise<Call[]> {
    return this.findByBroadcast(broadcastId);
  }

  async findByEmployeeId(employeeId: string): Promise<Call[]> {
    return this.findByEmployee(employeeId);
  }

  async findActiveCallsByEmployee(employeeId: string): Promise<Call[]> {
    const entities = await this.repository.find({ 
      where: { 
        employeeId,
        status: In([CallStatus.INITIATED, CallStatus.RINGING, CallStatus.ANSWERED])
      }
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async countByStatus(): Promise<Record<string, number>> {
    const results = await this.repository.createQueryBuilder('call')
      .select(['call.status', 'COUNT(*) as count'])
      .groupBy('call.status')
      .getRawMany();
    
    const counts: Record<string, number> = {};
    results.forEach(result => {
      counts[result.call_status] = parseInt(result.count);
    });
    return counts;
  }
}