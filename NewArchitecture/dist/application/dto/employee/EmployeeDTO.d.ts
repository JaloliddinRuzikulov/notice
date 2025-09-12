/**
 * Employee Data Transfer Objects
 */
import { BaseDTO } from '../base/BaseDTO';
export declare class EmployeeDTO extends BaseDTO {
    firstName: string;
    lastName: string;
    middleName?: string;
    phoneNumber: string;
    additionalPhone?: string;
    department: string;
    district: string;
    position?: string;
    rank?: string;
    notes?: string;
    photoUrl?: string;
    isActive: boolean;
    constructor(data: {
        id: string;
        firstName: string;
        lastName: string;
        middleName?: string;
        phoneNumber: string;
        additionalPhone?: string;
        department: string;
        district: string;
        position?: string;
        rank?: string;
        notes?: string;
        photoUrl?: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    });
    get fullName(): string;
}
export interface CreateEmployeeDTO {
    firstName: string;
    lastName: string;
    middleName?: string;
    phoneNumber: string;
    additionalPhone?: string;
    department: string;
    district: string;
    position?: string;
    rank?: string;
    notes?: string;
    photoUrl?: string;
}
export interface UpdateEmployeeDTO {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    phoneNumber?: string;
    additionalPhone?: string;
    department?: string;
    district?: string;
    position?: string;
    rank?: string;
    notes?: string;
    photoUrl?: string;
    isActive?: boolean;
}
export interface EmployeeSearchDTO {
    name?: string;
    department?: string;
    district?: string;
    position?: string;
    rank?: string;
    phoneNumber?: string;
    isActive?: boolean;
}
export interface EmployeeListRequestDTO {
    search?: EmployeeSearchDTO;
    pagination?: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
    };
}
//# sourceMappingURL=EmployeeDTO.d.ts.map