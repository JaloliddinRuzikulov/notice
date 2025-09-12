/**
 * District Entity for TypeORM
 * Maps District domain entity to database table
 */
import { EmployeeEntity } from './EmployeeEntity';
export declare class DistrictEntity {
    id: string;
    name: string;
    code: string;
    region?: string;
    population?: number;
    area?: number;
    center?: string;
    employeeCount: number;
    isActive: boolean;
    employees?: EmployeeEntity[];
    latitude?: number;
    longitude?: number;
    postalCode?: string;
    phoneCode?: string;
    populationDensity?: number;
    numberOfVillages?: number;
    numberOfMahallas?: number;
    economicActivity?: string;
    budget?: number;
    hokimName?: string;
    hokimPhone?: string;
    policeChiefName?: string;
    policePhone?: string;
    policeAddress?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
//# sourceMappingURL=DistrictEntity.d.ts.map