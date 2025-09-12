/**
 * Group Data Transfer Objects
 */

import { BaseDTO } from '../base/BaseDTO';
import { EmployeeDTO } from '../employee/EmployeeDTO';

export class GroupDTO extends BaseDTO {
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
  }) {
    super({
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });

    this.name = data.name;
    this.description = data.description;
    this.employeeIds = data.employeeIds;
    this.createdBy = data.createdBy;
    this.isActive = data.isActive;
  }

  get memberCount(): number {
    return this.employeeIds.length;
  }
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
  hasEmployee?: string; // employeeId
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