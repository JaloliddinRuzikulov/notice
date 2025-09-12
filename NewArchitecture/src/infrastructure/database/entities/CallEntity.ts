/**
 * Call Entity for TypeORM
 * Maps Call domain entity to database table
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BroadcastEntity } from './BroadcastEntity';
import { EmployeeEntity } from './EmployeeEntity';
import { AudioFileEntity } from './AudioFileEntity';

export enum CallStatusDB {
  INITIATED = 'initiated',
  RINGING = 'ringing',
  ANSWERED = 'answered',
  COMPLETED = 'completed',
  FAILED = 'failed',
  BUSY = 'busy',
  NO_ANSWER = 'no_answer',
  CANCELLED = 'cancelled'
}

export enum CallDirectionDB {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound'
}

export enum CallTypeDB {
  BROADCAST = 'broadcast',
  DIRECT = 'direct',
  EMERGENCY = 'emergency',
  TEST = 'test'
}

@Entity('calls')
@Index(['callId'], { unique: true })
@Index(['status'])
@Index(['broadcastId'])
@Index(['employeeId'])
@Index(['startTime'])
@Index(['from', 'to'])
export class CallEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  callId!: string; // SIP Call-ID

  @Column({ type: 'varchar', length: 50 })
  from!: string;

  @Column({ type: 'varchar', length: 50 })
  to!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'outbound'
  })
  direction!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'direct'
  })
  type!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'initiated'
  })
  status!: string;

  // Relations
  @Column({ type: 'uuid', nullable: true })
  broadcastId?: string;

  @ManyToOne(() => BroadcastEntity, broadcast => broadcast.calls, { eager: false })
  @JoinColumn({ name: 'broadcastId' })
  broadcast?: BroadcastEntity;

  @Column({ type: 'uuid', nullable: true })
  employeeId?: string;

  @ManyToOne(() => EmployeeEntity, { eager: false })
  @JoinColumn({ name: 'employeeId' })
  employee?: EmployeeEntity;

  // SIP Extension
  @Column({ type: 'varchar', length: 20, nullable: true })
  sipExtension?: string;

  // Timestamps
  @Column({ type: 'datetime' })
  startTime!: Date;

  @Column({ type: 'datetime', nullable: true })
  answerTime?: Date;

  @Column({ type: 'datetime', nullable: true })
  endTime?: Date;

  @Column({ type: 'int', nullable: true })
  duration?: number; // seconds

  // Recording
  @Column({ type: 'uuid', nullable: true })
  recordingId?: string;

  @ManyToOne(() => AudioFileEntity, { eager: false })
  @JoinColumn({ name: 'recordingId' })
  recording?: AudioFileEntity;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recordingUrl?: string;

  // DTMF
  @Column({ type: 'varchar', length: 100, nullable: true })
  dtmfInput?: string;

  // Error tracking
  @Column({ type: 'text', nullable: true })
  failureReason?: string;

  // Metadata
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  // Timestamps
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Call quality metrics
  @Column({ type: 'int', nullable: true })
  jitter?: number; // milliseconds

  @Column({ type: 'int', nullable: true })
  packetLoss?: number; // percentage

  @Column({ type: 'int', nullable: true })
  latency?: number; // milliseconds

  // Billing
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost?: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency?: string;
}