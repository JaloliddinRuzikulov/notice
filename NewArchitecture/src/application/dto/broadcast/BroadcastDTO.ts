/**
 * Broadcast Data Transfer Objects
 */

import { BaseDTO } from '../base/BaseDTO';
import { BroadcastType, BroadcastStatus } from '@/core/domain/entities/Broadcast';

export class BroadcastDTO extends BaseDTO {
  name: string;
  type: BroadcastType;
  audioFileId?: string;
  message?: string;
  targetEmployees: string[];
  targetDepartments: string[];
  targetDistricts: string[];
  scheduledFor: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: BroadcastStatus;
  progress: number;
  createdBy: string;
  notes?: string;

  constructor(data: {
    id: string;
    name: string;
    type: BroadcastType;
    audioFileId?: string;
    message?: string;
    targetEmployees: string[];
    targetDepartments: string[];
    targetDistricts: string[];
    scheduledFor: Date;
    startedAt?: Date;
    completedAt?: Date;
    status: BroadcastStatus;
    progress: number;
    createdBy: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super({
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });

    this.name = data.name;
    this.type = data.type;
    this.audioFileId = data.audioFileId;
    this.message = data.message;
    this.targetEmployees = data.targetEmployees;
    this.targetDepartments = data.targetDepartments;
    this.targetDistricts = data.targetDistricts;
    this.scheduledFor = data.scheduledFor;
    this.startedAt = data.startedAt;
    this.completedAt = data.completedAt;
    this.status = data.status;
    this.progress = data.progress;
    this.createdBy = data.createdBy;
    this.notes = data.notes;
  }

  get isActive(): boolean {
    return this.status === BroadcastStatus.IN_PROGRESS;
  }

  get isCompleted(): boolean {
    return this.status === BroadcastStatus.COMPLETED;
  }

  get duration(): number | null {
    if (this.startedAt && this.completedAt) {
      return Math.round((this.completedAt.getTime() - this.startedAt.getTime()) / 1000);
    }
    return null;
  }
}

export interface CreateBroadcastDTO {
  name: string;
  type: BroadcastType;
  audioFileId?: string;
  message?: string;
  targetEmployees?: string[];
  targetDepartments?: string[];
  targetDistricts?: string[];
  scheduledFor?: Date;
}

export interface BroadcastSearchDTO {
  name?: string;
  type?: BroadcastType;
  status?: BroadcastStatus;
  createdBy?: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

export interface BroadcastListRequestDTO {
  search?: BroadcastSearchDTO;
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  };
}

export interface BroadcastProgressDTO {
  totalTargets: number;
  completed: number;
  inProgress: number;
  failed: number;
  pending: number;
  progressPercentage: number;
}

export interface BroadcastStatusDTO {
  broadcast: BroadcastDTO;
  progress: BroadcastProgressDTO;
  callHistory?: Array<{
    employeeId: string;
    employeeName: string;
    phoneNumber: string;
    status: string;
    startTime?: Date;
    endTime?: Date;
    duration?: number;
  }>;
}

export interface StartBroadcastResponseDTO {
  broadcastId: string;
  message: string;
  scheduledFor: Date;
}

export interface StopBroadcastDTO {
  reason?: string;
}