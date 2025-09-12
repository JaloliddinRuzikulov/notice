/**
 * Employee Entity for TypeORM
 * Maps Employee domain entity to database table
 */
import { DepartmentEntity } from './DepartmentEntity';
import { DistrictEntity } from './DistrictEntity';
export declare class EmployeeEntity {
    id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    phoneNumber: string;
    additionalPhone?: string;
    position?: string;
    rank?: string;
    notes?: string;
    photoUrl?: string;
    isActive: boolean;
    department: string;
    departmentEntity?: DepartmentEntity;
    district: string;
    districtEntity?: DistrictEntity;
    createdAt: Date;
    updatedAt: Date;
    fullName?: string;
    deletedAt?: Date;
    metadata?: Record<string, any>;
    validatePhoneNumber(): void;
}
//# sourceMappingURL=EmployeeEntity.d.ts.map