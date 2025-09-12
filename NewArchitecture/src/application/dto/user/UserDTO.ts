/**
 * User Data Transfer Objects
 */

import { BaseDTO } from '../base/BaseDTO';
import { UserStatus } from '@/core/domain/entities/User';

export class UserDTO extends BaseDTO {
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  district?: string;
  department?: string;
  permissions: string[];
  status: UserStatus;
  lastLogin?: Date;
  lastLoginIP?: string;
  failedLoginAttempts: number;
  lockedUntil?: Date;

  constructor(data: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    district?: string;
    department?: string;
    permissions: string[];
    status: UserStatus;
    lastLogin?: Date;
    lastLoginIP?: string;
    failedLoginAttempts: number;
    lockedUntil?: Date;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super({
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });

    this.username = data.username;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.role = data.role;
    this.district = data.district;
    this.department = data.department;
    this.permissions = data.permissions;
    this.status = data.status;
    this.lastLogin = data.lastLogin;
    this.lastLoginIP = data.lastLoginIP;
    this.failedLoginAttempts = data.failedLoginAttempts;
    this.lockedUntil = data.lockedUntil;
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isLocked(): boolean {
    return !!(this.lockedUntil && this.lockedUntil > new Date());
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }
}

export interface LoginRequestDTO {
  username: string;
  password: string;
  ipAddress: string;
}

export interface LoginResponseDTO {
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    district?: string;
    department?: string;
    permissions: string[];
  };
  sessionId: string;
  expiresAt: Date;
}

export interface UserProfileDTO {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  district?: string;
  department?: string;
  permissions: string[];
  lastLogin?: Date;
  lastLoginIP?: string;
  createdAt: Date;
}

export interface CreateUserDTO {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  district?: string;
  department?: string;
  permissions?: string[];
}

export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  role?: string;
  district?: string;
  department?: string;
  permissions?: string[];
  status?: UserStatus;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}