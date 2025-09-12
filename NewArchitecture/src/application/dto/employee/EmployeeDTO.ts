/**
 * Employee Data Transfer Objects
 */

import { BaseDTO } from '../base/BaseDTO';

export class EmployeeDTO extends BaseDTO {
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
  }) {
    super({
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });

    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.middleName = data.middleName;
    this.phoneNumber = data.phoneNumber;
    this.additionalPhone = data.additionalPhone;
    this.department = data.department;
    this.district = data.district;
    this.position = data.position;
    this.rank = data.rank;
    this.notes = data.notes;
    this.photoUrl = data.photoUrl;
    this.isActive = data.isActive;
  }

  get fullName(): string {
    const names = [this.firstName, this.middleName, this.lastName].filter(Boolean);
    return names.join(' ');
  }
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