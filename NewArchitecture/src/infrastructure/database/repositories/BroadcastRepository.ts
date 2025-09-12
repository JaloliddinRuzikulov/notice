/**
 * Broadcast Repository Implementation
 * Concrete implementation of IBroadcastRepository
 */

import { injectable } from 'tsyringe';
import { IsNull, In, Between, MoreThanOrEqual, LessThanOrEqual, Not, Repository } from 'typeorm';
import { BroadcastEntity } from '../entities/BroadcastEntity';
import { 
  IBroadcastRepository, 
  BroadcastSearchCriteria,
  BroadcastStatistics
} from '@/core/domain/repositories/IBroadcastRepository';
import { 
  Broadcast, 
  BroadcastStatus, 
  BroadcastType, 
  BroadcastPriority,
  BroadcastRecipient
} from '@/core/domain/entities/Broadcast';
import { databaseConnection } from '../connection';

@injectable()
export class BroadcastRepository implements IBroadcastRepository {
  private repository: Repository<BroadcastEntity>;

  constructor() {
    const dataSource = databaseConnection.getDataSource();
    this.repository = dataSource.getRepository(BroadcastEntity);
  }

  // Convert entity to domain model
  private toDomainModel(entity: BroadcastEntity): Broadcast {
    return Broadcast.create({
      id: entity.id,
      title: entity.title,
      message: entity.message,
      type: this.mapTypeToDomain(entity.type),
      priority: this.mapPriorityToDomain(entity.priority),
      status: this.mapStatusToDomain(entity.status),
      recipients: entity.recipients.map(r => ({
        employeeId: r.employeeId,
        phoneNumber: r.phoneNumber,
        name: r.name,
        status: r.status,
        attempts: r.attempts,
        lastAttemptAt: r.lastAttemptAt,
        duration: r.duration,
        errorMessage: r.errorMessage
      } as BroadcastRecipient)),
      departmentIds: entity.departmentIds,
      districtIds: entity.districtIds,
      groupIds: entity.groupIds,
      scheduledAt: entity.scheduledAt,
      startedAt: entity.startedAt,
      completedAt: entity.completedAt,
      totalRecipients: entity.totalRecipients,
      successCount: entity.successCount,
      failureCount: entity.failureCount,
      averageDuration: entity.averageDuration,
      createdBy: entity.createdBy,
      cancelledBy: entity.cancelledBy,
      cancelReason: entity.cancelReason,
      audioFileUrl: entity.audioFileUrl,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  // Convert domain model to entity
  private toEntity(broadcast: Broadcast): Partial<BroadcastEntity> {
    const obj = broadcast.toObject();
    return {
      id: obj.id,
      title: obj.title,
      message: obj.message,
      type: this.mapTypeToEntity(obj.type),
      priority: this.mapPriorityToEntity(obj.priority),
      status: this.mapStatusToEntity(obj.status),
      recipients: obj.recipients.map(r => ({
        employeeId: r.employeeId,
        phoneNumber: r.phoneNumber,
        name: r.name,
        status: r.status,
        attempts: r.attempts,
        lastAttemptAt: r.lastAttemptAt,
        duration: r.duration,
        errorMessage: r.errorMessage
      })),
      departmentIds: obj.departmentIds,
      districtIds: obj.districtIds,
      groupIds: obj.groupIds,
      scheduledAt: obj.scheduledAt,
      startedAt: obj.startedAt,
      completedAt: obj.completedAt,
      totalRecipients: obj.totalRecipients,
      successCount: obj.successCount,
      failureCount: obj.failureCount,
      averageDuration: obj.averageDuration,
      createdBy: obj.createdBy,
      cancelledBy: obj.cancelledBy,
      cancelReason: obj.cancelReason,
      audioFileUrl: obj.audioFileUrl,
      metadata: obj.metadata,
      processedCount: obj.successCount + obj.failureCount,
      pendingCount: obj.totalRecipients - (obj.successCount + obj.failureCount),
      inProgressCount: 0
    };
  }

  // Map domain type to entity type
  private mapTypeToEntity(type: BroadcastType): string {
    const typeMap: Record<BroadcastType, string> = {
      [BroadcastType.VOICE]: 'voice',
      [BroadcastType.SMS]: 'sms',
      [BroadcastType.BOTH]: 'both',
    };
    return typeMap[type];
  }

  // Map entity type to domain type
  private mapTypeToDomain(type: string): BroadcastType {
    const typeMap: Record<string, BroadcastType> = {
      'voice': BroadcastType.VOICE,
      'sms': BroadcastType.SMS,
      'both': BroadcastType.BOTH,
    };
    return typeMap[type] || BroadcastType.VOICE;
  }

  // Map domain priority to entity priority
  private mapPriorityToEntity(priority: BroadcastPriority): string {
    const priorityMap: Record<BroadcastPriority, string> = {
      [BroadcastPriority.LOW]: 'low',
      [BroadcastPriority.NORMAL]: 'normal',
      [BroadcastPriority.HIGH]: 'high',
      [BroadcastPriority.URGENT]: 'urgent',
    };
    return priorityMap[priority];
  }

  // Map entity priority to domain priority
  private mapPriorityToDomain(priority: string): BroadcastPriority {
    const priorityMap: Record<string, BroadcastPriority> = {
      'low': BroadcastPriority.LOW,
      'normal': BroadcastPriority.NORMAL,
      'high': BroadcastPriority.HIGH,
      'urgent': BroadcastPriority.URGENT,
    };
    return priorityMap[priority] || BroadcastPriority.NORMAL;
  }

  // Map domain status to entity status
  private mapStatusToEntity(status: BroadcastStatus): string {
    const statusMap: Record<BroadcastStatus, string> = {
      [BroadcastStatus.PENDING]: 'pending',
      [BroadcastStatus.IN_PROGRESS]: 'in_progress',
      [BroadcastStatus.COMPLETED]: 'completed',
      [BroadcastStatus.CANCELLED]: 'cancelled',
      [BroadcastStatus.FAILED]: 'failed',
    };
    return statusMap[status];
  }

  // Map entity status to domain status
  private mapStatusToDomain(status: string): BroadcastStatus {
    const statusMap: Record<string, BroadcastStatus> = {
      'pending': BroadcastStatus.PENDING,
      'in_progress': BroadcastStatus.IN_PROGRESS,
      'completed': BroadcastStatus.COMPLETED,
      'cancelled': BroadcastStatus.CANCELLED,
      'failed': BroadcastStatus.FAILED,
    };
    return statusMap[status] || BroadcastStatus.PENDING;
  }

  async findById(id: string): Promise<Broadcast | null> {
    const entity = await this.repository.findOne({
      where: { id } as any
    });
    return entity ? this.toDomainModel(entity) : null;
  }

  async findAll(): Promise<Broadcast[]> {
    const entities = await this.repository.find({
      order: { createdAt: 'DESC' }
    });
    return entities.map(e => this.toDomainModel(e));
  }

  async save(broadcast: Broadcast): Promise<Broadcast> {
    const entityData = this.toEntity(broadcast);
    const entity = await this.repository.save(entityData as any);
    return this.toDomainModel(entity);
  }

  async update(id: string, broadcast: Partial<Broadcast>): Promise<Broadcast | null> {
    const entityData = this.toEntity(broadcast as Broadcast);
    await this.repository.update(id, entityData as any);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  // Status management
  async findByStatus(status: BroadcastStatus): Promise<Broadcast[]> {
    const entities = await this.repository.find({
      where: { status: this.mapStatusToEntity(status) },
      order: { createdAt: 'DESC' }
    });
    return entities.map(e => this.toDomainModel(e));
  }

  async findPending(): Promise<Broadcast[]> {
    return this.findByStatus(BroadcastStatus.PENDING);
  }

  async findInProgress(): Promise<Broadcast[]> {
    return this.findByStatus(BroadcastStatus.IN_PROGRESS);
  }

  async findCompleted(): Promise<Broadcast[]> {
    return this.findByStatus(BroadcastStatus.COMPLETED);
  }

  async findFailed(): Promise<Broadcast[]> {
    return this.findByStatus(BroadcastStatus.FAILED);
  }

  async updateStatus(id: string, status: BroadcastStatus): Promise<boolean> {
    const updates: Partial<BroadcastEntity> = {
      status: this.mapStatusToEntity(status)
    };

    if (status === BroadcastStatus.IN_PROGRESS) {
      updates.startedAt = new Date();
    } else if (status === BroadcastStatus.COMPLETED || status === BroadcastStatus.FAILED) {
      updates.completedAt = new Date();
    }

    const result = await this.repository.update(id, updates);
    return result.affected !== 0;
  }

  // Scheduling
  async findScheduled(): Promise<Broadcast[]> {
    const entities = await this.repository.find({
      where: {
        status: 'pending',
        scheduledAt: Not(IsNull())
      },
      order: { scheduledAt: 'ASC' }
    });
    return entities.map(e => this.toDomainModel(e));
  }

  async findScheduledForDate(date: Date): Promise<Broadcast[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const entities = await this.repository.find({
      where: {
        status: 'pending',
        scheduledAt: Between(startOfDay, endOfDay)
      },
      order: { scheduledAt: 'ASC' }
    });
    return entities.map(e => this.toDomainModel(e));
  }

  async findReadyToStart(): Promise<Broadcast[]> {
    const now = new Date();
    const entities = await this.repository.find({
      where: [
        {
          status: 'pending',
          scheduledAt: IsNull()
        },
        {
          status: 'pending',
          scheduledAt: LessThanOrEqual(now)
        }
      ],
      order: { priority: 'DESC', createdAt: 'ASC' }
    });
    return entities.map(e => this.toDomainModel(e));
  }

  // Recipients management
  async addRecipient(broadcastId: string, recipient: any): Promise<boolean> {
    const entity = await this.repository.findOne({ where: { id: broadcastId } });
    if (!entity) return false;

    entity.recipients.push(recipient);
    entity.totalRecipients = entity.recipients.length;
    entity.pendingCount = entity.recipients.filter(r => r.status === 'pending').length;

    const result = await this.repository.update(broadcastId, {
      recipients: entity.recipients,
      totalRecipients: entity.totalRecipients,
      pendingCount: entity.pendingCount
    });
    return result.affected !== 0;
  }

  async updateRecipientStatus(
    broadcastId: string,
    phoneNumber: string,
    status: string,
    duration?: number
  ): Promise<boolean> {
    const entity = await this.repository.findOne({ where: { id: broadcastId } });
    if (!entity) return false;

    const recipient = entity.recipients.find(r => r.phoneNumber === phoneNumber);
    if (!recipient) return false;

    recipient.status = status;
    recipient.lastAttemptAt = new Date();
    recipient.attempts++;
    if (duration) recipient.duration = duration;

    // Update statistics
    const successCount = entity.recipients.filter(r => r.status === 'success').length;
    const failureCount = entity.recipients.filter(r => r.status === 'failed').length;
    const processedCount = successCount + failureCount;
    const pendingCount = entity.totalRecipients - processedCount;

    const result = await this.repository.update(broadcastId, {
      recipients: entity.recipients,
      successCount,
      failureCount,
      processedCount,
      pendingCount
    });
    return result.affected !== 0;
  }

  async getRecipients(broadcastId: string): Promise<any[]> {
    const entity = await this.repository.findOne({ where: { id: broadcastId } });
    return entity ? entity.recipients : [];
  }

  async getPendingRecipients(broadcastId: string): Promise<any[]> {
    const recipients = await this.getRecipients(broadcastId);
    return recipients.filter(r => r.status === 'pending' || r.status === 'retry');
  }

  // Search and filtering
  async search(criteria: BroadcastSearchCriteria): Promise<Broadcast[]> {
    const queryBuilder = this.repository.createQueryBuilder('broadcast');

    if (criteria.title) {
      queryBuilder.andWhere('broadcast.title LIKE :title', {
        title: `%${criteria.title}%`
      });
    }

    if (criteria.type) {
      queryBuilder.andWhere('broadcast.type = :type', {
        type: this.mapTypeToEntity(criteria.type)
      });
    }

    if (criteria.priority) {
      queryBuilder.andWhere('broadcast.priority = :priority', {
        priority: this.mapPriorityToEntity(criteria.priority)
      });
    }

    if (criteria.status) {
      queryBuilder.andWhere('broadcast.status = :status', {
        status: this.mapStatusToEntity(criteria.status)
      });
    }

    if (criteria.createdBy) {
      queryBuilder.andWhere('broadcast.createdBy = :createdBy', {
        createdBy: criteria.createdBy
      });
    }

    if (criteria.startDate && criteria.endDate) {
      queryBuilder.andWhere('broadcast.createdAt BETWEEN :startDate AND :endDate', {
        startDate: criteria.startDate,
        endDate: criteria.endDate
      });
    }

    queryBuilder.orderBy('broadcast.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();
    return entities.map(e => this.toDomainModel(e));
  }

  async findByCreator(userId: string): Promise<Broadcast[]> {
    const entities = await this.repository.find({
      where: { createdBy: userId },
      order: { createdAt: 'DESC' }
    });
    return entities.map(e => this.toDomainModel(e));
  }

  async findByDepartment(departmentId: string): Promise<Broadcast[]> {
    const queryBuilder = this.repository.createQueryBuilder('broadcast');
    queryBuilder.where('JSON_CONTAINS(broadcast.departmentIds, :departmentId)', {
      departmentId: JSON.stringify(departmentId)
    });
    queryBuilder.orderBy('broadcast.createdAt', 'DESC');
    const entities = await queryBuilder.getMany();
    return entities.map(e => this.toDomainModel(e));
  }

  async findByDistrict(districtId: string): Promise<Broadcast[]> {
    const queryBuilder = this.repository.createQueryBuilder('broadcast');
    queryBuilder.where('JSON_CONTAINS(broadcast.districtIds, :districtId)', {
      districtId: JSON.stringify(districtId)
    });
    queryBuilder.orderBy('broadcast.createdAt', 'DESC');
    const entities = await queryBuilder.getMany();
    return entities.map(e => this.toDomainModel(e));
  }

  async findByGroup(groupId: string): Promise<Broadcast[]> {
    const queryBuilder = this.repository.createQueryBuilder('broadcast');
    queryBuilder.where('JSON_CONTAINS(broadcast.groupIds, :groupId)', {
      groupId: JSON.stringify(groupId)
    });
    queryBuilder.orderBy('broadcast.createdAt', 'DESC');
    const entities = await queryBuilder.getMany();
    return entities.map(e => this.toDomainModel(e));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Broadcast[]> {
    const entities = await this.repository.find({
      where: {
        createdAt: Between(startDate, endDate)
      },
      order: { createdAt: 'DESC' }
    });
    return entities.map(e => this.toDomainModel(e));
  }

  // Priority management
  async findByPriority(priority: BroadcastPriority): Promise<Broadcast[]> {
    const entities = await this.repository.find({
      where: { priority: this.mapPriorityToEntity(priority) },
      order: { createdAt: 'DESC' }
    });
    return entities.map(e => this.toDomainModel(e));
  }

  async findUrgentBroadcasts(): Promise<Broadcast[]> {
    const entities = await this.repository.find({
      where: {
        priority: 'urgent',
        status: In(['pending', 'in_progress'])
      },
      order: { createdAt: 'ASC' }
    });
    return entities.map(e => this.toDomainModel(e));
  }

  async getNextBroadcastToProcess(): Promise<Broadcast | null> {
    const entity = await this.repository.findOne({
      where: {
        status: 'pending'
      },
      order: {
        priority: 'DESC',
        createdAt: 'ASC'
      }
    });
    return entity ? this.toDomainModel(entity) : null;
  }

  // Statistics
  async getStatistics(startDate?: Date, endDate?: Date): Promise<BroadcastStatistics> {
    const queryBuilder = this.repository.createQueryBuilder('broadcast');

    if (startDate && endDate) {
      queryBuilder.where('broadcast.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      });
    }

    const result = await queryBuilder
      .select('COUNT(*)', 'totalBroadcasts')
      .addSelect('SUM(CASE WHEN broadcast.status = :completed THEN 1 ELSE 0 END)', 'successfulBroadcasts')
      .addSelect('SUM(CASE WHEN broadcast.status = :failed THEN 1 ELSE 0 END)', 'failedBroadcasts')
      .addSelect('SUM(CASE WHEN broadcast.status = :pending THEN 1 ELSE 0 END)', 'pendingBroadcasts')
      .addSelect('AVG(broadcast.averageDuration)', 'averageDuration')
      .addSelect('AVG(broadcast.totalRecipients)', 'averageRecipientsPerBroadcast')
      .setParameters({
        completed: 'completed',
        failed: 'failed',
        pending: 'pending'
      })
      .getRawOne();

    const totalBroadcasts = parseInt(result.totalBroadcasts) || 0;
    const successfulBroadcasts = parseInt(result.successfulBroadcasts) || 0;

    return {
      totalBroadcasts,
      successfulBroadcasts,
      failedBroadcasts: parseInt(result.failedBroadcasts) || 0,
      pendingBroadcasts: parseInt(result.pendingBroadcasts) || 0,
      averageDuration: parseFloat(result.averageDuration) || 0,
      averageRecipientsPerBroadcast: parseFloat(result.averageRecipientsPerBroadcast) || 0,
      successRate: totalBroadcasts > 0 ? (successfulBroadcasts / totalBroadcasts) * 100 : 0
    };
  }

  async getStatisticsByCreator(userId: string): Promise<BroadcastStatistics> {
    return this.getStatistics(); // Simplified for now
  }

  async getStatisticsByDepartment(departmentId: string): Promise<BroadcastStatistics> {
    return this.getStatistics(); // Simplified for now
  }

  async getStatisticsByDistrict(districtId: string): Promise<BroadcastStatistics> {
    return this.getStatistics(); // Simplified for now
  }

  async getDailyStatistics(date: Date): Promise<BroadcastStatistics> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return this.getStatistics(startOfDay, endOfDay);
  }

  async getMonthlyStatistics(year: number, month: number): Promise<BroadcastStatistics> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return this.getStatistics(startDate, endDate);
  }

  // History
  async getHistory(limit?: number): Promise<Broadcast[]> {
    const entities = await this.repository.find({
      where: {
        status: In(['completed', 'cancelled', 'failed'])
      },
      order: { completedAt: 'DESC' },
      take: limit
    });
    return entities.map(e => this.toDomainModel(e));
  }

  async getHistoryByUser(userId: string, limit?: number): Promise<Broadcast[]> {
    const entities = await this.repository.find({
      where: {
        createdBy: userId,
        status: In(['completed', 'cancelled', 'failed'])
      },
      order: { completedAt: 'DESC' },
      take: limit
    });
    return entities.map(e => this.toDomainModel(e));
  }

  async archiveOldBroadcasts(beforeDate: Date): Promise<number> {
    const result = await this.repository.delete({
      completedAt: LessThanOrEqual(beforeDate),
      status: In(['completed', 'cancelled'])
    });
    return result.affected || 0;
  }

  // Bulk operations
  async cancelMany(ids: string[], reason: string): Promise<number> {
    const result = await this.repository.update(
      { id: In(ids) },
      {
        status: 'cancelled',
        cancelReason: reason,
        completedAt: new Date()
      }
    );
    return result.affected || 0;
  }

  async deleteMany(ids: string[]): Promise<number> {
    let count = 0;
    for (const id of ids) {
      const result = await this.repository.delete(id);
      count += result.affected || 0;
    }
    return count;
  }

  // Check existence
  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } as any });
    return count > 0;
  }

  async hasActiveBroadcast(): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        status: In(['pending', 'in_progress'])
      }
    });
    return count > 0;
  }

  async countActive(): Promise<number> {
    return this.repository.count({
      where: {
        status: In(['pending', 'in_progress'])
      }
    });
  }

  async countTotal(): Promise<number> {
    return this.repository.count();
  }
}