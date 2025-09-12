/**
 * District Data Transfer Objects
 */
import { BaseDTO } from '../base/BaseDTO';
export declare class DistrictDTO extends BaseDTO {
    name: string;
    code: string;
    region?: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    isActive: boolean;
    employeeCount?: number;
    constructor(data: {
        id: string;
        name: string;
        code: string;
        region?: string;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
        isActive: boolean;
        employeeCount?: number;
        createdAt: Date;
        updatedAt: Date;
    });
    get hasEmployees(): boolean;
    get hasCoordinates(): boolean;
}
export interface CreateDistrictDTO {
    name: string;
    code: string;
    region?: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
}
export interface UpdateDistrictDTO {
    name?: string;
    code?: string;
    region?: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    isActive?: boolean;
}
export interface DistrictSearchDTO {
    name?: string;
    code?: string;
    region?: string;
    isActive?: boolean;
    hasEmployees?: boolean;
    nearCoordinates?: {
        latitude: number;
        longitude: number;
        radiusKm: number;
    };
}
export interface DistrictListRequestDTO {
    search?: DistrictSearchDTO;
    pagination?: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
    };
    includeEmployeeCount?: boolean;
    groupByRegion?: boolean;
}
export interface DistrictsByRegionDTO {
    region: string;
    districts: DistrictDTO[];
    totalEmployees: number;
}
export interface DistrictStatisticsDTO {
    totalDistricts: number;
    activeDistricts: number;
    inactiveDistricts: number;
    totalRegions: number;
    averageEmployeesPerDistrict: number;
    districtsWithCoordinates: number;
    largestDistrict: {
        id: string;
        name: string;
        employeeCount: number;
    };
    regionDistribution: Array<{
        region: string;
        districtCount: number;
        employeeCount: number;
    }>;
}
//# sourceMappingURL=DistrictDTO.d.ts.map