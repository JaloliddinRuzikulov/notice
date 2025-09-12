/**
 * District Data Transfer Objects
 */

import { BaseDTO } from '../base/BaseDTO';

export class DistrictDTO extends BaseDTO {
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
  }) {
    super({
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });

    this.name = data.name;
    this.code = data.code;
    this.region = data.region;
    this.coordinates = data.coordinates;
    this.isActive = data.isActive;
    this.employeeCount = data.employeeCount;
  }

  get hasEmployees(): boolean {
    return (this.employeeCount || 0) > 0;
  }

  get hasCoordinates(): boolean {
    return !!(this.coordinates?.latitude && this.coordinates?.longitude);
  }
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