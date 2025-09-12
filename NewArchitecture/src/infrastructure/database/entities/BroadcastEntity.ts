/**
 * Broadcast Entity for TypeORM
 * Maps Broadcast domain entity to database table
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './UserEntity';
import { CallEntity } from './CallEntity';
import { AudioFileEntity } from './AudioFileEntity';

export enum BroadcastStatusDB {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed'
}

export enum BroadcastTypeDB {
  VOICE = 'voice',
  SMS = 'sms',
  BOTH = 'both'
}

export enum BroadcastPriorityDB {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

@Entity('broadcasts')
@Index(['status'])
@Index(['priority'])
@Index(['createdBy'])
@Index(['scheduledAt'])
@Index(['createdAt'])
export class BroadcastEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({
    type: 'varchar',
    length: 10,
    default: 'voice'
  })
  type!: string;

  @Column({
    type: 'varchar',
    length: 10,
    default: 'normal'
  })
  priority!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending'
  })
  status!: string;

  // Recipients as JSON
  @Column({ type: 'json' })
  recipients!: Array<{
    employeeId?: string;
    phoneNumber: string;
    name?: string;
    status: string;
    attempts: number;
    lastAttemptAt?: Date;
    duration?: number;
    errorMessage?: string;
  }>;

  // Target groups
  @Column({ type: 'json', nullable: true })
  departmentIds?: string[];

  @Column({ type: 'json', nullable: true })
  districtIds?: string[];

  @Column({ type: 'json', nullable: true })
  groupIds?: string[];

  // Scheduling
  @Column({ type: 'datetime', nullable: true })
  scheduledAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  startedAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  completedAt?: Date;

  // Statistics
  @Column({ type: 'int', default: 0 })
  totalRecipients!: number;

  @Column({ type: 'int', default: 0 })
  successCount!: number;

  @Column({ type: 'int', default: 0 })
  failureCount!: number;

  @Column({ type: 'int', nullable: true })
  averageDuration?: number;

  // Relations
  @Column({ type: 'uuid' })
  createdBy!: string;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'createdBy' })
  creator?: UserEntity;

  @Column({ type: 'uuid', nullable: true })
  cancelledBy?: string;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'cancelledBy' })
  canceller?: UserEntity;

  @Column({ type: 'text', nullable: true })
  cancelReason?: string;

  // Audio file relation
  @Column({ type: 'uuid', nullable: true })
  audioFileId?: string;

  @ManyToOne(() => AudioFileEntity, { eager: false })
  @JoinColumn({ name: 'audioFileId' })
  audioFile?: AudioFileEntity;

  @Column({ type: 'varchar', length: 500, nullable: true })
  audioFileUrl?: string;

  // Calls relation
  @OneToMany(() => CallEntity, call => call.broadcast)
  calls?: CallEntity[];

  // Metadata
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  // Timestamps
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Retry configuration
  @Column({ type: 'int', default: 3 })
  maxRetries!: number;

  @Column({ type: 'int', default: 30 })
  retryDelay!: number; // seconds

  // Call configuration
  @Column({ type: 'int', default: 30 })
  callTimeout!: number; // seconds

  @Column({ type: 'int', default: 5 })
  maxConcurrentCalls!: number;

  // Progress tracking
  @Column({ type: 'int', default: 0 })
  processedCount!: number;

  @Column({ type: 'int', default: 0 })
  pendingCount!: number;

  @Column({ type: 'int', default: 0 })
  inProgressCount!: number;
}