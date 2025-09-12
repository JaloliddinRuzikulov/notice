/**
 * User Domain Entity
 * Represents system users with authentication and authorization
 */

export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
  DISTRICT_ADMIN = 'district_admin'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
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

export class User {
  private readonly _id?: string;
  private _username: string;
  private _email?: string;
  private _passwordHash?: string;
  private _firstName: string;
  private _lastName: string;
  private _middleName?: string;
  private _role: UserRole;
  private _status: UserStatus;
  private _district?: string;
  private _department?: string;
  private _phoneNumber?: string;
  private _lastLoginAt?: Date;
  private _lastLoginIp?: string;
  private _failedLoginAttempts: number;
  private _lockedUntil?: Date;
  private _permissions: string[];
  private _metadata?: Record<string, any>;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: UserProps) {
    this.validateProps(props);
    
    this._id = props.id;
    this._username = props.username.toLowerCase();
    this._email = props.email?.toLowerCase();
    this._passwordHash = props.passwordHash;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._middleName = props.middleName;
    this._role = props.role;
    this._status = props.status;
    this._district = props.district;
    this._department = props.department;
    this._phoneNumber = props.phoneNumber;
    this._lastLoginAt = props.lastLoginAt;
    this._lastLoginIp = props.lastLoginIp;
    this._failedLoginAttempts = props.failedLoginAttempts ?? 0;
    this._lockedUntil = props.lockedUntil;
    this._permissions = props.permissions ?? [];
    this._metadata = props.metadata;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // Getters
  get id(): string | undefined {
    return this._id;
  }

  get username(): string {
    return this._username;
  }

  get email(): string | undefined {
    return this._email;
  }

  get passwordHash(): string | undefined {
    return this._passwordHash;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get middleName(): string | undefined {
    return this._middleName;
  }

  get fullName(): string {
    const parts = [this._firstName, this._lastName];
    if (this._middleName) {
      parts.push(this._middleName);
    }
    return parts.join(' ');
  }

  get role(): UserRole {
    return this._role;
  }

  get status(): UserStatus {
    return this._status;
  }

  get district(): string | undefined {
    return this._district;
  }

  get department(): string | undefined {
    return this._department;
  }

  get phoneNumber(): string | undefined {
    return this._phoneNumber;
  }

  get lastLoginAt(): Date | undefined {
    return this._lastLoginAt;
  }

  get lastLoginIp(): string | undefined {
    return this._lastLoginIp;
  }

  get failedLoginAttempts(): number {
    return this._failedLoginAttempts;
  }

  get lockedUntil(): Date | undefined {
    return this._lockedUntil;
  }

  get permissions(): string[] {
    return this._permissions;
  }

  get metadata(): Record<string, any> | undefined {
    return this._metadata;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business methods
  updatePassword(passwordHash: string): void {
    this._passwordHash = passwordHash;
    this._failedLoginAttempts = 0;
    this._lockedUntil = undefined;
    this.updateTimestamp();
  }

  recordSuccessfulLogin(ipAddress: string): void {
    this._lastLoginAt = new Date();
    this._lastLoginIp = ipAddress;
    this._failedLoginAttempts = 0;
    this._lockedUntil = undefined;
    this.updateTimestamp();
  }

  recordFailedLogin(): void {
    this._failedLoginAttempts++;
    
    // Lock account after 5 failed attempts for 30 minutes
    if (this._failedLoginAttempts >= 5) {
      const lockDuration = 30 * 60 * 1000; // 30 minutes
      this._lockedUntil = new Date(Date.now() + lockDuration);
      this._status = UserStatus.SUSPENDED;
    }
    
    this.updateTimestamp();
  }

  unlock(): void {
    this._failedLoginAttempts = 0;
    this._lockedUntil = undefined;
    if (this._status === UserStatus.SUSPENDED) {
      this._status = UserStatus.ACTIVE;
    }
    this.updateTimestamp();
  }

  changeRole(role: UserRole): void {
    this._role = role;
    this.updateTimestamp();
  }

  changeStatus(status: UserStatus): void {
    this._status = status;
    this.updateTimestamp();
  }

  activate(): void {
    this._status = UserStatus.ACTIVE;
    this.updateTimestamp();
  }

  deactivate(): void {
    this._status = UserStatus.INACTIVE;
    this.updateTimestamp();
  }

  suspend(until?: Date): void {
    this._status = UserStatus.SUSPENDED;
    if (until) {
      this._lockedUntil = until;
    }
    this.updateTimestamp();
  }

  addPermission(permission: string): void {
    if (!this._permissions.includes(permission)) {
      this._permissions.push(permission);
      this.updateTimestamp();
    }
  }

  removePermission(permission: string): void {
    const index = this._permissions.indexOf(permission);
    if (index > -1) {
      this._permissions.splice(index, 1);
      this.updateTimestamp();
    }
  }

  hasPermission(permission: string): boolean {
    return this._permissions.includes(permission);
  }

  updateDistrict(district: string | undefined): void {
    this._district = district;
    this.updateTimestamp();
  }

  updateDepartment(department: string | undefined): void {
    this._department = department;
    this.updateTimestamp();
  }

  updateEmail(email: string | undefined): void {
    if (email) {
      this._email = email.toLowerCase();
    } else {
      this._email = undefined;
    }
    this.updateTimestamp();
  }

  updatePhoneNumber(phoneNumber: string | undefined): void {
    this._phoneNumber = phoneNumber;
    this.updateTimestamp();
  }

  updateMetadata(key: string, value: any): void {
    if (!this._metadata) {
      this._metadata = {};
    }
    this._metadata[key] = value;
    this.updateTimestamp();
  }

  // Validation
  private validateProps(props: UserProps): void {
    if (!props.username || props.username.trim().length < 3) {
      throw new Error('Username must be at least 3 characters');
    }
    if (!props.firstName || props.firstName.trim().length === 0) {
      throw new Error('First name is required');
    }
    if (!props.lastName || props.lastName.trim().length === 0) {
      throw new Error('Last name is required');
    }
    if (props.email && !this.isValidEmail(props.email)) {
      throw new Error('Invalid email format');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  // Business rules
  isLocked(): boolean {
    if (!this._lockedUntil) return false;
    return this._lockedUntil > new Date();
  }

  isAdmin(): boolean {
    return this._role === UserRole.ADMIN;
  }

  isDistrictAdmin(): boolean {
    return this._role === UserRole.DISTRICT_ADMIN;
  }

  canAccessDistrict(district: string): boolean {
    if (this.isAdmin()) return true;
    if (this.isDistrictAdmin() && this._district === district) return true;
    return false;
  }

  canManageUsers(): boolean {
    return this.isAdmin() || this.hasPermission('manage_users');
  }

  canBroadcast(): boolean {
    return this._role !== UserRole.VIEWER || this.hasPermission('broadcast');
  }

  // Factory method
  static create(props: UserProps): User {
    return new User(props);
  }

  // Convert to plain object
  toObject(): UserProps {
    return {
      id: this._id,
      username: this._username,
      email: this._email,
      passwordHash: this._passwordHash,
      firstName: this._firstName,
      lastName: this._lastName,
      middleName: this._middleName,
      role: this._role,
      status: this._status,
      district: this._district,
      department: this._department,
      phoneNumber: this._phoneNumber,
      lastLoginAt: this._lastLoginAt,
      lastLoginIp: this._lastLoginIp,
      failedLoginAttempts: this._failedLoginAttempts,
      lockedUntil: this._lockedUntil,
      permissions: [...this._permissions],
      metadata: this._metadata ? { ...this._metadata } : undefined,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}