/**
 * Department Data Transfer Objects
 */

import { BaseDTO } from '../base/BaseDTO';

export class DepartmentDTO extends BaseDTO {
  name: string;
  code: string;
  description?: string;
  parentDepartmentId?: string;
  parentDepartmentName?: string;
  level: number;
  isActive: boolean;
  employeeCount?: number;

  constructor(data: {
    id: string;
    name: string;
    code: string;
    description?: string;
    parentDepartmentId?: string;
    parentDepartmentName?: string;
    level: number;
    isActive: boolean;
    employeeCount?: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super({
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });

    this.name = data.name;
    this.code = data.code;
    this.description = data.description;
    this.parentDepartmentId = data.parentDepartmentId;
    this.parentDepartmentName = data.parentDepartmentName;
    this.level = data.level;
    this.isActive = data.isActive;
    this.employeeCount = data.employeeCount;
  }

  get isRootDepartment(): boolean {
    return !this.parentDepartmentId;
  }

  get hasEmployees(): boolean {
    return (this.employeeCount || 0) > 0;
  }
}

export interface DepartmentTreeDTO extends DepartmentDTO {
  children: DepartmentTreeDTO[];
  path: string[];
}

export interface CreateDepartmentDTO {
  name: string;
  code: string;
  description?: string;
  parentDepartmentId?: string;
}

export interface UpdateDepartmentDTO {
  name?: string;
  code?: string;
  description?: string;
  parentDepartmentId?: string;
  isActive?: boolean;
}

export interface DepartmentSearchDTO {
  name?: string;
  code?: string;
  parentDepartmentId?: string;
  level?: number;
  isActive?: boolean;
  hasEmployees?: boolean;
}

export interface DepartmentListRequestDTO {
  search?: DepartmentSearchDTO;
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  };
  includeEmployeeCount?: boolean;
  treeStructure?: boolean;
}

export interface DepartmentStatisticsDTO {
  totalDepartments: number;
  activeDepartments: number;
  inactiveDepartments: number;
  rootDepartments: number;
  averageEmployeesPerDepartment: number;
  maxLevel: number;
  largestDepartment: {
    id: string;
    name: string;
    employeeCount: number;
  };
}