/**
 * User Domain Entity
 * Represents system users with authentication and authorization
 */
export declare enum UserRole {
    ADMIN = "admin",
    OPERATOR = "operator",
    VIEWER = "viewer",
    DISTRICT_ADMIN = "district_admin"
}
export declare enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended",
    PENDING = "pending"
}
export interface UserProps {
    id?: string;
    username: string;
    email?: string;
    passwordHash?: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    role: UserRole;
    status: UserStatus;
    district?: string;
    department?: string;
    phoneNumber?: string;
    lastLoginAt?: Date;
    lastLoginIp?: string;
    failedLoginAttempts?: number;
    lockedUntil?: Date;
    permissions?: string[];
    metadata?: Record<string, any>;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class User {
    private readonly _id?;
    private _username;
    private _email?;
    private _passwordHash?;
    private _firstName;
    private _lastName;
    private _middleName?;
    private _role;
    private _status;
    private _district?;
    private _department?;
    private _phoneNumber?;
    private _lastLoginAt?;
    private _lastLoginIp?;
    private _failedLoginAttempts;
    private _lockedUntil?;
    private _permissions;
    private _metadata?;
    private readonly _createdAt;
    private _updatedAt;
    constructor(props: UserProps);
    get id(): string | undefined;
    get username(): string;
    get email(): string | undefined;
    get passwordHash(): string | undefined;
    get firstName(): string;
    get lastName(): string;
    get middleName(): string | undefined;
    get fullName(): string;
    get role(): UserRole;
    get status(): UserStatus;
    get district(): string | undefined;
    get department(): string | undefined;
    get phoneNumber(): string | undefined;
    get lastLoginAt(): Date | undefined;
    get lastLoginIp(): string | undefined;
    get failedLoginAttempts(): number;
    get lockedUntil(): Date | undefined;
    get permissions(): string[];
    get metadata(): Record<string, any> | undefined;
    get createdAt(): Date;
    get updatedAt(): Date;
    updatePassword(passwordHash: string): void;
    recordSuccessfulLogin(ipAddress: string): void;
    recordFailedLogin(): void;
    unlock(): void;
    changeRole(role: UserRole): void;
    changeStatus(status: UserStatus): void;
    activate(): void;
    deactivate(): void;
    suspend(until?: Date): void;
    addPermission(permission: string): void;
    removePermission(permission: string): void;
    hasPermission(permission: string): boolean;
    updateDistrict(district: string | undefined): void;
    updateDepartment(department: string | undefined): void;
    updateEmail(email: string | undefined): void;
    updatePhoneNumber(phoneNumber: string | undefined): void;
    updateMetadata(key: string, value: any): void;
    private validateProps;
    private isValidEmail;
    private updateTimestamp;
    isLocked(): boolean;
    isAdmin(): boolean;
    isDistrictAdmin(): boolean;
    canAccessDistrict(district: string): boolean;
    canManageUsers(): boolean;
    canBroadcast(): boolean;
    static create(props: UserProps): User;
    toObject(): UserProps;
}
//# sourceMappingURL=User.d.ts.map