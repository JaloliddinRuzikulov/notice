/**
 * Department Entity for TypeORM
 * Maps Department domain entity to database table
 */
import { EmployeeEntity } from './EmployeeEntity';
export declare class DepartmentEntity {
    id: string;
    name: string;
    code: string;
    description?: string;
    level: number;
    order?: number;
    isActive: boolean;
    employeeCount: number;
    parent?: DepartmentEntity;
    children?: DepartmentEntity[];
    parentId?: string;
    employees?: EmployeeEntity[];
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    phoneNumber?: string;
    email?: string;
    address?: string;
    headName?: string;
    headPosition?: string;
}
//# sourceMappingURL=DepartmentEntity.d.ts.map