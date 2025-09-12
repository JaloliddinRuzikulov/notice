/**
 * SIP Account Data Transfer Objects
 */
import { BaseDTO } from '../base/BaseDTO';
import { SIPAccountStatus } from '@/core/domain/entities/SIPAccount';
export declare class SIPAccountDTO extends BaseDTO {
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
    });
    get isOnline(): boolean;
    get isAssigned(): boolean;
    get lastSeenAgo(): string | null;
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
    passwordTemplate?: string;
}
export interface SIPRegistrationEventDTO {
    extension: string;
    status: SIPAccountStatus;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}
//# sourceMappingURL=SIPAccountDTO.d.ts.map