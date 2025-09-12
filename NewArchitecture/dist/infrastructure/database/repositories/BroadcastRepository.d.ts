/**
 * Broadcast Repository Implementation
 * Concrete implementation of IBroadcastRepository
 */
import { IBroadcastRepository, BroadcastSearchCriteria, BroadcastStatistics } from '@/core/domain/repositories/IBroadcastRepository';
import { Broadcast, BroadcastStatus, BroadcastPriority } from '@/core/domain/entities/Broadcast';
export declare class BroadcastRepository implements IBroadcastRepository {
    private repository;
    constructor();
    private toDomainModel;
    private toEntity;
    private mapTypeToEntity;
    private mapTypeToDomain;
    private mapPriorityToEntity;
    private mapPriorityToDomain;
    private mapStatusToEntity;
    private mapStatusToDomain;
    findById(id: string): Promise<Broadcast | null>;
    findAll(): Promise<Broadcast[]>;
    save(broadcast: Broadcast): Promise<Broadcast>;
    update(id: string, broadcast: Partial<Broadcast>): Promise<Broadcast | null>;
    delete(id: string): Promise<boolean>;
    findByStatus(status: BroadcastStatus): Promise<Broadcast[]>;
    findPending(): Promise<Broadcast[]>;
    findInProgress(): Promise<Broadcast[]>;
    findCompleted(): Promise<Broadcast[]>;
    findFailed(): Promise<Broadcast[]>;
    updateStatus(id: string, status: BroadcastStatus): Promise<boolean>;
    findScheduled(): Promise<Broadcast[]>;
    findScheduledForDate(date: Date): Promise<Broadcast[]>;
    findReadyToStart(): Promise<Broadcast[]>;
    addRecipient(broadcastId: string, recipient: any): Promise<boolean>;
    updateRecipientStatus(broadcastId: string, phoneNumber: string, status: string, duration?: number): Promise<boolean>;
    getRecipients(broadcastId: string): Promise<any[]>;
    getPendingRecipients(broadcastId: string): Promise<any[]>;
    search(criteria: BroadcastSearchCriteria): Promise<Broadcast[]>;
    findByCreator(userId: string): Promise<Broadcast[]>;
    findByDepartment(departmentId: string): Promise<Broadcast[]>;
    findByDistrict(districtId: string): Promise<Broadcast[]>;
    findByGroup(groupId: string): Promise<Broadcast[]>;
    findByDateRange(startDate: Date, endDate: Date): Promise<Broadcast[]>;
    findByPriority(priority: BroadcastPriority): Promise<Broadcast[]>;
    findUrgentBroadcasts(): Promise<Broadcast[]>;
    getNextBroadcastToProcess(): Promise<Broadcast | null>;
    getStatistics(startDate?: Date, endDate?: Date): Promise<BroadcastStatistics>;
    getStatisticsByCreator(userId: string): Promise<BroadcastStatistics>;
    getStatisticsByDepartment(departmentId: string): Promise<BroadcastStatistics>;
    getStatisticsByDistrict(districtId: string): Promise<BroadcastStatistics>;
    getDailyStatistics(date: Date): Promise<BroadcastStatistics>;
    getMonthlyStatistics(year: number, month: number): Promise<BroadcastStatistics>;
    getHistory(limit?: number): Promise<Broadcast[]>;
    getHistoryByUser(userId: string, limit?: number): Promise<Broadcast[]>;
    archiveOldBroadcasts(beforeDate: Date): Promise<number>;
    cancelMany(ids: string[], reason: string): Promise<number>;
    deleteMany(ids: string[]): Promise<number>;
    exists(id: string): Promise<boolean>;
    hasActiveBroadcast(): Promise<boolean>;
    countActive(): Promise<number>;
    countTotal(): Promise<number>;
}
//# sourceMappingURL=BroadcastRepository.d.ts.map