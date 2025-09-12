/**
 * Group Data Transfer Objects
 */
import { BaseDTO } from '../base/BaseDTO';
export declare class GroupDTO extends BaseDTO {
    name: string;
    description?: string;
    employeeIds: string[];
    createdBy: string;
    isActive: boolean;
    constructor(data: {
        id: string;
        name: string;
        description?: string;
        employeeIds: string[];
        createdBy: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    });
    get memberCount(): number;
}
export interface GroupWithEmployeesDTO extends GroupDTO {
    employees: Array<{
        id: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        department: string;
        isActive: boolean;
    }>;
}
export interface CreateGroupDTO {
    name: string;
    description?: string;
    employeeIds: string[];
}
export interface UpdateGroupDTO {
    name?: string;
    description?: string;
    employeeIds?: string[];
    isActive?: boolean;
}
export interface GroupSearchDTO {
    name?: string;
    createdBy?: string;
    isActive?: boolean;
    hasEmployee?: string;
}
export interface GroupListRequestDTO {
    search?: GroupSearchDTO;
    pagination?: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
    };
    includeEmployees?: boolean;
}
export interface AddEmployeesToGroupDTO {
    employeeIds: string[];
}
export interface RemoveEmployeesFromGroupDTO {
    employeeIds: string[];
}
export interface GroupMembershipDTO {
    groupId: string;
    groupName: string;
    employeeId: string;
    employeeName: string;
    joinedAt: Date;
}
export interface GroupStatisticsDTO {
    totalGroups: number;
    activeGroups: number;
    inactiveGroups: number;
    totalMembers: number;
    averageMembersPerGroup: number;
    largestGroup: {
        id: string;
        name: string;
        memberCount: number;
    };
}
//# sourceMappingURL=GroupDTO.d.ts.map