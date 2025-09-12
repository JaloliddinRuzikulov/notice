"use strict";
/**
 * Broadcast Repository Implementation
 * Concrete implementation of IBroadcastRepository
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastRepository = void 0;
const tsyringe_1 = require("tsyringe");
const typeorm_1 = require("typeorm");
const BroadcastEntity_1 = require("../entities/BroadcastEntity");
const Broadcast_1 = require("@/core/domain/entities/Broadcast");
const connection_1 = require("../connection");
let BroadcastRepository = class BroadcastRepository {
    repository;
    constructor() {
        const dataSource = connection_1.databaseConnection.getDataSource();
        this.repository = dataSource.getRepository(BroadcastEntity_1.BroadcastEntity);
    }
    // Convert entity to domain model
    toDomainModel(entity) {
        return Broadcast_1.Broadcast.create({
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
            })),
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
    toEntity(broadcast) {
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
    mapTypeToEntity(type) {
        const typeMap = {
            [Broadcast_1.BroadcastType.VOICE]: BroadcastEntity_1.BroadcastTypeDB.VOICE,
            [Broadcast_1.BroadcastType.SMS]: BroadcastEntity_1.BroadcastTypeDB.SMS,
            [Broadcast_1.BroadcastType.BOTH]: BroadcastEntity_1.BroadcastTypeDB.BOTH,
        };
        return typeMap[type];
    }
    // Map entity type to domain type
    mapTypeToDomain(type) {
        const typeMap = {
            [BroadcastEntity_1.BroadcastTypeDB.VOICE]: Broadcast_1.BroadcastType.VOICE,
            [BroadcastEntity_1.BroadcastTypeDB.SMS]: Broadcast_1.BroadcastType.SMS,
            [BroadcastEntity_1.BroadcastTypeDB.BOTH]: Broadcast_1.BroadcastType.BOTH,
        };
        return typeMap[type];
    }
    // Map domain priority to entity priority
    mapPriorityToEntity(priority) {
        const priorityMap = {
            [Broadcast_1.BroadcastPriority.LOW]: BroadcastEntity_1.BroadcastPriorityDB.LOW,
            [Broadcast_1.BroadcastPriority.NORMAL]: BroadcastEntity_1.BroadcastPriorityDB.NORMAL,
            [Broadcast_1.BroadcastPriority.HIGH]: BroadcastEntity_1.BroadcastPriorityDB.HIGH,
            [Broadcast_1.BroadcastPriority.URGENT]: BroadcastEntity_1.BroadcastPriorityDB.URGENT,
        };
        return priorityMap[priority];
    }
    // Map entity priority to domain priority
    mapPriorityToDomain(priority) {
        const priorityMap = {
            [BroadcastEntity_1.BroadcastPriorityDB.LOW]: Broadcast_1.BroadcastPriority.LOW,
            [BroadcastEntity_1.BroadcastPriorityDB.NORMAL]: Broadcast_1.BroadcastPriority.NORMAL,
            [BroadcastEntity_1.BroadcastPriorityDB.HIGH]: Broadcast_1.BroadcastPriority.HIGH,
            [BroadcastEntity_1.BroadcastPriorityDB.URGENT]: Broadcast_1.BroadcastPriority.URGENT,
        };
        return priorityMap[priority];
    }
    // Map domain status to entity status
    mapStatusToEntity(status) {
        const statusMap = {
            [Broadcast_1.BroadcastStatus.PENDING]: BroadcastEntity_1.BroadcastStatusDB.PENDING,
            [Broadcast_1.BroadcastStatus.IN_PROGRESS]: BroadcastEntity_1.BroadcastStatusDB.IN_PROGRESS,
            [Broadcast_1.BroadcastStatus.COMPLETED]: BroadcastEntity_1.BroadcastStatusDB.COMPLETED,
            [Broadcast_1.BroadcastStatus.CANCELLED]: BroadcastEntity_1.BroadcastStatusDB.CANCELLED,
            [Broadcast_1.BroadcastStatus.FAILED]: BroadcastEntity_1.BroadcastStatusDB.FAILED,
        };
        return statusMap[status];
    }
    // Map entity status to domain status
    mapStatusToDomain(status) {
        const statusMap = {
            [BroadcastEntity_1.BroadcastStatusDB.PENDING]: Broadcast_1.BroadcastStatus.PENDING,
            [BroadcastEntity_1.BroadcastStatusDB.IN_PROGRESS]: Broadcast_1.BroadcastStatus.IN_PROGRESS,
            [BroadcastEntity_1.BroadcastStatusDB.COMPLETED]: Broadcast_1.BroadcastStatus.COMPLETED,
            [BroadcastEntity_1.BroadcastStatusDB.CANCELLED]: Broadcast_1.BroadcastStatus.CANCELLED,
            [BroadcastEntity_1.BroadcastStatusDB.FAILED]: Broadcast_1.BroadcastStatus.FAILED,
        };
        return statusMap[status];
    }
    async findById(id) {
        const entity = await this.repository.findOne({
            where: { id }
        });
        return entity ? this.toDomainModel(entity) : null;
    }
    async findAll() {
        const entities = await this.repository.find({
            order: { createdAt: 'DESC' }
        });
        return entities.map(e => this.toDomainModel(e));
    }
    async save(broadcast) {
        const entityData = this.toEntity(broadcast);
        const entity = await this.repository.save(entityData);
        return this.toDomainModel(entity);
    }
    async update(id, broadcast) {
        const entityData = this.toEntity(broadcast);
        await this.repository.update(id, entityData);
        return this.findById(id);
    }
    async delete(id) {
        const result = await this.repository.delete(id);
        return result.affected !== 0;
    }
    // Status management
    async findByStatus(status) {
        const entities = await this.repository.find({
            where: { status: this.mapStatusToEntity(status) },
            order: { createdAt: 'DESC' }
        });
        return entities.map(e => this.toDomainModel(e));
    }
    async findPending() {
        return this.findByStatus(Broadcast_1.BroadcastStatus.PENDING);
    }
    async findInProgress() {
        return this.findByStatus(Broadcast_1.BroadcastStatus.IN_PROGRESS);
    }
    async findCompleted() {
        return this.findByStatus(Broadcast_1.BroadcastStatus.COMPLETED);
    }
    async findFailed() {
        return this.findByStatus(Broadcast_1.BroadcastStatus.FAILED);
    }
    async updateStatus(id, status) {
        const updates = {
            status: this.mapStatusToEntity(status)
        };
        if (status === Broadcast_1.BroadcastStatus.IN_PROGRESS) {
            updates.startedAt = new Date();
        }
        else if (status === Broadcast_1.BroadcastStatus.COMPLETED || status === Broadcast_1.BroadcastStatus.FAILED) {
            updates.completedAt = new Date();
        }
        const result = await this.repository.update(id, updates);
        return result.affected !== 0;
    }
    // Scheduling
    async findScheduled() {
        const entities = await this.repository.find({
            where: {
                status: BroadcastEntity_1.BroadcastStatusDB.PENDING,
                scheduledAt: (0, typeorm_1.Not)((0, typeorm_1.IsNull)())
            },
            order: { scheduledAt: 'ASC' }
        });
        return entities.map(e => this.toDomainModel(e));
    }
    async findScheduledForDate(date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const entities = await this.repository.find({
            where: {
                status: BroadcastEntity_1.BroadcastStatusDB.PENDING,
                scheduledAt: (0, typeorm_1.Between)(startOfDay, endOfDay)
            },
            order: { scheduledAt: 'ASC' }
        });
        return entities.map(e => this.toDomainModel(e));
    }
    async findReadyToStart() {
        const now = new Date();
        const entities = await this.repository.find({
            where: [
                {
                    status: BroadcastEntity_1.BroadcastStatusDB.PENDING,
                    scheduledAt: (0, typeorm_1.IsNull)()
                },
                {
                    status: BroadcastEntity_1.BroadcastStatusDB.PENDING,
                    scheduledAt: (0, typeorm_1.LessThanOrEqual)(now)
                }
            ],
            order: { priority: 'DESC', createdAt: 'ASC' }
        });
        return entities.map(e => this.toDomainModel(e));
    }
    // Recipients management
    async addRecipient(broadcastId, recipient) {
        const entity = await this.repository.findOne({ where: { id: broadcastId } });
        if (!entity)
            return false;
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
    async updateRecipientStatus(broadcastId, phoneNumber, status, duration) {
        const entity = await this.repository.findOne({ where: { id: broadcastId } });
        if (!entity)
            return false;
        const recipient = entity.recipients.find(r => r.phoneNumber === phoneNumber);
        if (!recipient)
            return false;
        recipient.status = status;
        recipient.lastAttemptAt = new Date();
        recipient.attempts++;
        if (duration)
            recipient.duration = duration;
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
    async getRecipients(broadcastId) {
        const entity = await this.repository.findOne({ where: { id: broadcastId } });
        return entity ? entity.recipients : [];
    }
    async getPendingRecipients(broadcastId) {
        const recipients = await this.getRecipients(broadcastId);
        return recipients.filter(r => r.status === 'pending' || r.status === 'retry');
    }
    // Search and filtering
    async search(criteria) {
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
    async findByCreator(userId) {
        const entities = await this.repository.find({
            where: { createdBy: userId },
            order: { createdAt: 'DESC' }
        });
        return entities.map(e => this.toDomainModel(e));
    }
    async findByDepartment(departmentId) {
        const queryBuilder = this.repository.createQueryBuilder('broadcast');
        queryBuilder.where('JSON_CONTAINS(broadcast.departmentIds, :departmentId)', {
            departmentId: JSON.stringify(departmentId)
        });
        queryBuilder.orderBy('broadcast.createdAt', 'DESC');
        const entities = await queryBuilder.getMany();
        return entities.map(e => this.toDomainModel(e));
    }
    async findByDistrict(districtId) {
        const queryBuilder = this.repository.createQueryBuilder('broadcast');
        queryBuilder.where('JSON_CONTAINS(broadcast.districtIds, :districtId)', {
            districtId: JSON.stringify(districtId)
        });
        queryBuilder.orderBy('broadcast.createdAt', 'DESC');
        const entities = await queryBuilder.getMany();
        return entities.map(e => this.toDomainModel(e));
    }
    async findByGroup(groupId) {
        const queryBuilder = this.repository.createQueryBuilder('broadcast');
        queryBuilder.where('JSON_CONTAINS(broadcast.groupIds, :groupId)', {
            groupId: JSON.stringify(groupId)
        });
        queryBuilder.orderBy('broadcast.createdAt', 'DESC');
        const entities = await queryBuilder.getMany();
        return entities.map(e => this.toDomainModel(e));
    }
    async findByDateRange(startDate, endDate) {
        const entities = await this.repository.find({
            where: {
                createdAt: (0, typeorm_1.Between)(startDate, endDate)
            },
            order: { createdAt: 'DESC' }
        });
        return entities.map(e => this.toDomainModel(e));
    }
    // Priority management
    async findByPriority(priority) {
        const entities = await this.repository.find({
            where: { priority: this.mapPriorityToEntity(priority) },
            order: { createdAt: 'DESC' }
        });
        return entities.map(e => this.toDomainModel(e));
    }
    async findUrgentBroadcasts() {
        const entities = await this.repository.find({
            where: {
                priority: BroadcastEntity_1.BroadcastPriorityDB.URGENT,
                status: (0, typeorm_1.In)([BroadcastEntity_1.BroadcastStatusDB.PENDING, BroadcastEntity_1.BroadcastStatusDB.IN_PROGRESS])
            },
            order: { createdAt: 'ASC' }
        });
        return entities.map(e => this.toDomainModel(e));
    }
    async getNextBroadcastToProcess() {
        const entity = await this.repository.findOne({
            where: {
                status: BroadcastEntity_1.BroadcastStatusDB.PENDING
            },
            order: {
                priority: 'DESC',
                createdAt: 'ASC'
            }
        });
        return entity ? this.toDomainModel(entity) : null;
    }
    // Statistics
    async getStatistics(startDate, endDate) {
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
            completed: BroadcastEntity_1.BroadcastStatusDB.COMPLETED,
            failed: BroadcastEntity_1.BroadcastStatusDB.FAILED,
            pending: BroadcastEntity_1.BroadcastStatusDB.PENDING
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
    async getStatisticsByCreator(userId) {
        return this.getStatistics(); // Simplified for now
    }
    async getStatisticsByDepartment(departmentId) {
        return this.getStatistics(); // Simplified for now
    }
    async getStatisticsByDistrict(districtId) {
        return this.getStatistics(); // Simplified for now
    }
    async getDailyStatistics(date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        return this.getStatistics(startOfDay, endOfDay);
    }
    async getMonthlyStatistics(year, month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        return this.getStatistics(startDate, endDate);
    }
    // History
    async getHistory(limit) {
        const entities = await this.repository.find({
            where: {
                status: (0, typeorm_1.In)([BroadcastEntity_1.BroadcastStatusDB.COMPLETED, BroadcastEntity_1.BroadcastStatusDB.CANCELLED, BroadcastEntity_1.BroadcastStatusDB.FAILED])
            },
            order: { completedAt: 'DESC' },
            take: limit
        });
        return entities.map(e => this.toDomainModel(e));
    }
    async getHistoryByUser(userId, limit) {
        const entities = await this.repository.find({
            where: {
                createdBy: userId,
                status: (0, typeorm_1.In)([BroadcastEntity_1.BroadcastStatusDB.COMPLETED, BroadcastEntity_1.BroadcastStatusDB.CANCELLED, BroadcastEntity_1.BroadcastStatusDB.FAILED])
            },
            order: { completedAt: 'DESC' },
            take: limit
        });
        return entities.map(e => this.toDomainModel(e));
    }
    async archiveOldBroadcasts(beforeDate) {
        const result = await this.repository.delete({
            completedAt: (0, typeorm_1.LessThanOrEqual)(beforeDate),
            status: (0, typeorm_1.In)([BroadcastEntity_1.BroadcastStatusDB.COMPLETED, BroadcastEntity_1.BroadcastStatusDB.CANCELLED])
        });
        return result.affected || 0;
    }
    // Bulk operations
    async cancelMany(ids, reason) {
        const result = await this.repository.update({ id: (0, typeorm_1.In)(ids) }, {
            status: BroadcastEntity_1.BroadcastStatusDB.CANCELLED,
            cancelReason: reason,
            completedAt: new Date()
        });
        return result.affected || 0;
    }
    async deleteMany(ids) {
        let count = 0;
        for (const id of ids) {
            const result = await this.repository.delete(id);
            count += result.affected || 0;
        }
        return count;
    }
    // Check existence
    async exists(id) {
        const count = await this.repository.count({ where: { id } });
        return count > 0;
    }
    async hasActiveBroadcast() {
        const count = await this.repository.count({
            where: {
                status: (0, typeorm_1.In)([BroadcastEntity_1.BroadcastStatusDB.PENDING, BroadcastEntity_1.BroadcastStatusDB.IN_PROGRESS])
            }
        });
        return count > 0;
    }
    async countActive() {
        return this.repository.count({
            where: {
                status: (0, typeorm_1.In)([BroadcastEntity_1.BroadcastStatusDB.PENDING, BroadcastEntity_1.BroadcastStatusDB.IN_PROGRESS])
            }
        });
    }
    async countTotal() {
        return this.repository.count();
    }
};
exports.BroadcastRepository = BroadcastRepository;
exports.BroadcastRepository = BroadcastRepository = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [])
], BroadcastRepository);
//# sourceMappingURL=BroadcastRepository.js.map