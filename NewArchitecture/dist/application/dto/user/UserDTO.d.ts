/**
 * User Data Transfer Objects
 */
import { BaseDTO } from '../base/BaseDTO';
import { UserStatus } from '@/core/domain/entities/User';
export declare class UserDTO extends BaseDTO {
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
    });
    get fullName(): string;
    get isLocked(): boolean;
    get isActive(): boolean;
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
//# sourceMappingURL=UserDTO.d.ts.map