/**
 * Call Repository Interface
 * Domain layer repository contract for Call entity
 */

import { Call, CallStatus, CallDirection, CallType } from '../entities/Call';

export interface CallSearchCriteria {
  callId?: string;
  from?: string;
  to?: string;
  direction?: CallDirection;
  type?: CallType;
  status?: CallStatus;
  broadcastId?: string;
  employeeId?: string;
  sipExtension?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface CallStatistics {
  totalCalls: number;
  answeredCalls: number;
  failedCalls: number;
  busyCalls: number;
  noAnswerCalls: number;
  averageDuration: number;
  averageWaitTime: number;
  answerRate: number;
  totalDuration: number;
}

export interface ICallRepository {
  // Basic CRUD operations
  findById(id: string): Promise<Call | null>;
  findByCallId(callId: string): Promise<Call | null>;
  findAll(): Promise<Call[]>;
  save(call: Call): Promise<Call>;
  update(id: string, call: Partial<Call>): Promise<Call | null>;
  delete(id: string): Promise<boolean>;
  
  // Status management
  findByStatus(status: CallStatus): Promise<Call[]>;
  findActive(): Promise<Call[]>;
  findCompleted(): Promise<Call[]>;
  findFailed(): Promise<Call[]>;
  updateStatus(id: string, status: CallStatus): Promise<boolean>;
  
  // Call lifecycle
  startCall(call: Call): Promise<Call>;
  answerCall(id: string): Promise<boolean>;
  completeCall(id: string, duration: number): Promise<boolean>;
  failCall(id: string, reason: string): Promise<boolean>;
  cancelCall(id: string): Promise<boolean>;
  
  // Search and filtering
  search(criteria: CallSearchCriteria): Promise<Call[]>;
  findByPhoneNumber(phoneNumber: string): Promise<Call[]>;
  findByEmployee(employeeId: string): Promise<Call[]>;
  findByBroadcast(broadcastId: string): Promise<Call[]>;
  findBySipExtension(extension: string): Promise<Call[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Call[]>;
  
  // Direction and type
  findInbound(): Promise<Call[]>;
  findOutbound(): Promise<Call[]>;
  findByType(type: CallType): Promise<Call[]>;
  
  // Recording management
  updateRecording(id: string, recordingUrl: string): Promise<boolean>;
  findWithRecordings(): Promise<Call[]>;
  findWithoutRecordings(): Promise<Call[]>;
  
  // DTMF management
  updateDtmfInput(id: string, dtmfInput: string): Promise<boolean>;
  findByDtmfInput(dtmfInput: string): Promise<Call[]>;
  
  // Statistics
  getStatistics(startDate?: Date, endDate?: Date): Promise<CallStatistics>;
  getStatisticsByEmployee(employeeId: string): Promise<CallStatistics>;
  getStatisticsByBroadcast(broadcastId: string): Promise<CallStatistics>;
  getStatisticsBySipExtension(extension: string): Promise<CallStatistics>;
  getDailyStatistics(date: Date): Promise<CallStatistics>;
  getHourlyStatistics(date: Date, hour: number): Promise<CallStatistics>;
  
  // Call history
  getHistory(limit?: number): Promise<Call[]>;
  getHistoryByEmployee(employeeId: string, limit?: number): Promise<Call[]>;
  getHistoryByPhoneNumber(phoneNumber: string, limit?: number): Promise<Call[]>;
  
  // Concurrent calls
  getActiveCalls(): Promise<Call[]>;
  getActiveCallCount(): Promise<number>;
  getActiveCallsBySipExtension(extension: string): Promise<Call[]>;
  
  // Bulk operations
  deleteMany(ids: string[]): Promise<number>;
  deleteOldCalls(beforeDate: Date): Promise<number>;
  
  // Check existence
  exists(id: string): Promise<boolean>;
  existsByCallId(callId: string): Promise<boolean>;
  hasActiveCalls(): Promise<boolean>;
  countTotal(): Promise<number>;
  countActive(): Promise<number>;
}