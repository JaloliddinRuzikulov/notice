/**
 * SIP Account Data Transfer Objects
 */

import { BaseDTO } from '../base/BaseDTO';
import { SIPAccountStatus } from '@/core/domain/entities/SIPAccount';

export class SIPAccountDTO extends BaseDTO {
  extension: string;
  password: string;
  employeeId?: string;
  employeeName?: string;
  status: SIPAccountStatus;
  lastRegistered?: Date;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;

  constructor(data: {
    id: string;
    extension: string;
    password: string;
    employeeId?: string;
    employeeName?: string;
    status: SIPAccountStatus;
    lastRegistered?: Date;
    ipAddress?: string;
    userAgent?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super({
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });

    this.extension = data.extension;
    this.password = data.password;
    this.employeeId = data.employeeId;
    this.employeeName = data.employeeName;
    this.status = data.status;
    this.lastRegistered = data.lastRegistered;
    this.ipAddress = data.ipAddress;
    this.userAgent = data.userAgent;
    this.isActive = data.isActive;
  }

  get isOnline(): boolean {
    return this.status === SIPAccountStatus.REGISTERED;
  }

  get isAssigned(): boolean {
    return !!this.employeeId;
  }

  get lastSeenAgo(): string | null {
    if (!this.lastRegistered) return null;
    
    const now = new Date();
    const diff = now.getTime() - this.lastRegistered.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}

export interface CreateSIPAccountDTO {
  extension: string;
  password: string;
  employeeId?: string;
}

export interface UpdateSIPAccountDTO {
  password?: string;
  employeeId?: string;
  isActive?: boolean;
}

export interface SIPAccountSearchDTO {
  extension?: string;
  employeeId?: string;
  employeeName?: string;
  status?: SIPAccountStatus;
  isActive?: boolean;
  isAssigned?: boolean;
  lastRegisteredAfter?: Date;
}

export interface SIPAccountListRequestDTO {
  search?: SIPAccountSearchDTO;
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  };
  includeEmployeeDetails?: boolean;
}

export interface AssignSIPAccountDTO {
  employeeId: string;
}

export interface UnassignSIPAccountDTO {
  reason?: string;
}

export interface SIPAccountStatisticsDTO {
  totalAccounts: number;
  activeAccounts: number;
  registeredAccounts: number;
  assignedAccounts: number;
  unassignedAccounts: number;
  offlineAccounts: number;
  statusDistribution: Array<{
    status: SIPAccountStatus;
    count: number;
    percentage: number;
  }>;
}

export interface BulkCreateSIPAccountsDTO {
  extensionRange: {
    start: string;
    end: string;
  };
  passwordTemplate?: string; // e.g., "ext_{extension}_pass"
}

export interface SIPRegistrationEventDTO {
  extension: string;
  status: SIPAccountStatus;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}