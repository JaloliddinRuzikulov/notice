/**
 * Department Data Transfer Objects
 */
import { BaseDTO } from '../base/BaseDTO';
export declare class DepartmentDTO extends BaseDTO {
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
    });
    get isRootDepartment(): boolean;
    get hasEmployees(): boolean;
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
//# sourceMappingURL=DepartmentDTO.d.ts.map