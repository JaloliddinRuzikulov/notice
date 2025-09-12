/**
 * Broadcast Repository Interface
 * Domain layer repository contract for Broadcast entity
 */

import { Broadcast, BroadcastStatus, BroadcastType, BroadcastPriority } from '../entities/Broadcast';

export interface BroadcastSearchCriteria {
  title?: string;
  type?: BroadcastType;
  priority?: BroadcastPriority;
  status?: BroadcastStatus;
  createdBy?: string;
  departmentId?: string;
  districtId?: string;
  groupId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface BroadcastStatistics {
  totalBroadcasts: number;
  successfulBroadcasts: number;
  failedBroadcasts: number;
  pendingBroadcasts: number;
  averageDuration: number;
  averageRecipientsPerBroadcast: number;
  successRate: number;
}

export interface IBroadcastRepository {
  // Basic CRUD operations
  findById(id: string): Promise<Broadcast | null>;
  findAll(): Promise<Broadcast[]>;
  save(broadcast: Broadcast): Promise<Broadcast>;
  update(id: string, broadcast: Partial<Broadcast>): Promise<Broadcast | null>;
  delete(id: string): Promise<boolean>;
  
  // Status management
  findByStatus(status: BroadcastStatus): Promise<Broadcast[]>;
  findPending(): Promise<Broadcast[]>;
  findInProgress(): Promise<Broadcast[]>;
  findCompleted(): Promise<Broadcast[]>;
  findFailed(): Promise<Broadcast[]>;
  updateStatus(id: string, status: BroadcastStatus): Promise<boolean>;
  
  // Scheduling
  findScheduled(): Promise<Broadcast[]>;
  findScheduledForDate(date: Date): Promise<Broadcast[]>;
  findReadyToStart(): Promise<Broadcast[]>;
  
  // Recipients management
  addRecipient(broadcastId: string, recipient: any): Promise<boolean>;
  updateRecipientStatus(
    broadcastId: string, 
    phoneNumber: string, 
    status: string, 
    duration?: number
  ): Promise<boolean>;
  getRecipients(broadcastId: string): Promise<any[]>;
  getPendingRecipients(broadcastId: string): Promise<any[]>;
  
  // Search and filtering
  search(criteria: BroadcastSearchCriteria): Promise<Broadcast[]>;
  findByCreator(userId: string): Promise<Broadcast[]>;
  findByDepartment(departmentId: string): Promise<Broadcast[]>;
  findByDistrict(districtId: string): Promise<Broadcast[]>;
  findByGroup(groupId: string): Promise<Broadcast[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Broadcast[]>;
  
  // Priority management
  findByPriority(priority: BroadcastPriority): Promise<Broadcast[]>;
  findUrgentBroadcasts(): Promise<Broadcast[]>;
  getNextBroadcastToProcess(): Promise<Broadcast | null>;
  
  // Statistics
  getStatistics(startDate?: Date, endDate?: Date): Promise<BroadcastStatistics>;
  getStatisticsByCreator(userId: string): Promise<BroadcastStatistics>;
  getStatisticsByDepartment(departmentId: string): Promise<BroadcastStatistics>;
  getStatisticsByDistrict(districtId: string): Promise<BroadcastStatistics>;
  getDailyStatistics(date: Date): Promise<BroadcastStatistics>;
  getMonthlyStatistics(year: number, month: number): Promise<BroadcastStatistics>;
  
  // History
  getHistory(limit?: number): Promise<Broadcast[]>;
  getHistoryByUser(userId: string, limit?: number): Promise<Broadcast[]>;
  archiveOldBroadcasts(beforeDate: Date): Promise<number>;
  
  // Bulk operations
  cancelMany(ids: string[], reason: string): Promise<number>;
  deleteMany(ids: string[]): Promise<number>;
  
  // Check existence
  exists(id: string): Promise<boolean>;
  hasActiveBroadcast(): Promise<boolean>;
  countActive(): Promise<number>;
  countTotal(): Promise<number>;
}