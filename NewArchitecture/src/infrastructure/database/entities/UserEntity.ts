/**
 * User Entity for TypeORM
 * Maps User domain entity to database table
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

export enum UserRoleDB {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
  DISTRICT_ADMIN = 'district_admin'
}

export enum UserStatusDB {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

@Entity('users')
@Index(['username'], { unique: true })
@Index(['email'], { unique: true, where: 'email IS NOT NULL' })
@Index(['role'])
@Index(['status'])
@Index(['district'])
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  middleName?: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'operator'
  })
  role!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending'
  })
  status!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  district?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneNumber?: string;

  // Authentication tracking
  @Column({ type: 'datetime', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  lastLoginIp?: string;

  @Column({ type: 'int', default: 0 })
  failedLoginAttempts!: number;

  @Column({ type: 'datetime', nullable: true })
  lockedUntil?: Date;

  // Permissions as JSON array
  @Column({ type: 'json', nullable: true })
  permissions?: string[];

  // Metadata
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  // Timestamps
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Soft delete support
  @Column({ type: 'datetime', nullable: true })
  deletedAt?: Date;

  // Session tracking
  @Column({ type: 'varchar', length: 255, nullable: true })
  currentSessionId?: string;

  @Column({ type: 'datetime', nullable: true })
  sessionExpiresAt?: Date;

  // Password reset
  @Column({ type: 'varchar', length: 255, nullable: true })
  resetPasswordToken?: string;

  @Column({ type: 'datetime', nullable: true })
  resetPasswordExpires?: Date;

  // Email verification
  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emailVerificationToken?: string;

  // Two-factor authentication
  @Column({ type: 'boolean', default: false })
  twoFactorEnabled!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  twoFactorSecret?: string;

  // Validation
  @BeforeInsert()
  @BeforeUpdate()
  normalizeData() {
    if (this.username) {
      this.username = this.username.toLowerCase();
    }
    if (this.email) {
      this.email = this.email.toLowerCase();
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  validateEmail() {
    if (this.email && !this.isValidEmail(this.email)) {
      throw new Error(`Invalid email format: ${this.email}`);
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}