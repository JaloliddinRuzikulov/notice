/**
 * Call Data Transfer Objects
 */

import { BaseDTO } from '../base/BaseDTO';
import { CallStatus } from '@/core/domain/entities/Call';

export class CallDTO extends BaseDTO {
  employeeId: string;
  employeeName: string;
  phoneNumber: string;
  broadcastId?: string;
  broadcastName?: string;
  startTime: Date;
  endTime?: Date;
  status: CallStatus;
  duration: number;
  callerId?: string;
  notes?: string;

  constructor(data: {
    id: string;
    employeeId: string;
    employeeName: string;
    phoneNumber: string;
    broadcastId?: string;
    broadcastName?: string;
    startTime: Date;
    endTime?: Date;
    status: CallStatus;
    duration: number;
    callerId?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super({
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });

    this.employeeId = data.employeeId;
    this.employeeName = data.employeeName;
    this.phoneNumber = data.phoneNumber;
    this.broadcastId = data.broadcastId;
    this.broadcastName = data.broadcastName;
    this.startTime = data.startTime;
    this.endTime = data.endTime;
    this.status = data.status;
    this.duration = data.duration;
    this.callerId = data.callerId;
    this.notes = data.notes;
  }

  get isCompleted(): boolean {
    return this.status === CallStatus.COMPLETED;
  }

  get isFailed(): boolean {
    return this.status === CallStatus.FAILED;
  }

  get formattedDuration(): string {
    if (this.duration < 60) {
      return `${this.duration}s`;
    }
    
    const minutes = Math.floor(this.duration / 60);
    const seconds = this.duration % 60;
    return `${minutes}m ${seconds}s`;
  }
}

export interface CreateCallRecordDTO {
  employeeId: string;
  phoneNumber: string;
  broadcastId?: string;
  startTime: Date;
  endTime?: Date;
  status: CallStatus;
  duration?: number;
  callerId?: string;
  notes?: string;
}

export interface UpdateCallStatusDTO {
  status: CallStatus;
  endTime?: Date;
  duration?: number;
  notes?: string;
}

export interface CallSearchDTO {
  employeeId?: string;
  employeeName?: string;
  phoneNumber?: string;
  broadcastId?: string;
  status?: CallStatus;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  minDuration?: number;
  maxDuration?: number;
}

export interface CallHistoryRequestDTO {
  search?: CallSearchDTO;
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  };
}

export interface CallStatisticsDTO {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageDuration: number;
  successRate: number;
}

export interface CallHistoryResponseDTO {
  calls: CallDTO[];
  statistics: CallStatisticsDTO;
}

export interface CallReportDTO {
  period: {
    startDate: Date;
    endDate: Date;
  };
  statistics: CallStatisticsDTO;
  topEmployees: Array<{
    employeeId: string;
    employeeName: string;
    callCount: number;
    successRate: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    callCount: number;
  }>;
  statusDistribution: Array<{
    status: CallStatus;
    count: number;
    percentage: number;
  }>;
}