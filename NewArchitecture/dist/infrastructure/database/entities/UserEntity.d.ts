/**
 * User Entity for TypeORM
 * Maps User domain entity to database table
 */
export declare enum UserRoleDB {
    ADMIN = "admin",
    OPERATOR = "operator",
    VIEWER = "viewer",
    DISTRICT_ADMIN = "district_admin"
}
export declare enum UserStatusDB {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended",
    PENDING = "pending"
}
export declare class UserEntity {
    id: string;
    username: string;
    email?: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    role: UserRoleDB;
    status: UserStatusDB;
    district?: string;
    department?: string;
    phoneNumber?: string;
    lastLoginAt?: Date;
    lastLoginIp?: string;
    failedLoginAttempts: number;
    lockedUntil?: Date;
    permissions?: string[];
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    currentSessionId?: string;
    sessionExpiresAt?: Date;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    emailVerified: boolean;
    emailVerificationToken?: string;
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    normalizeData(): void;
    validateEmail(): void;
    private isValidEmail;
}
//# sourceMappingURL=UserEntity.d.ts.map