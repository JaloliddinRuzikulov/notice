/**
 * SIPAccount Entity for TypeORM
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SIPAccountStatusDB {
  REGISTERED = 'registered',
  UNREGISTERED = 'unregistered',
  REGISTERING = 'registering',
  FAILED = 'failed',
  SUSPENDED = 'suspended'
}

export enum SIPTransportDB {
  UDP = 'udp',
  TCP = 'tcp',
  TLS = 'tls',
  WS = 'ws',
  WSS = 'wss'
}

@Entity('sip_accounts')
@Index(['extension'], { unique: true })
@Index(['status'])
export class SIPAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  extension!: string;

  @Column({ type: 'varchar', length: 50 })
  username!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password?: string; // encrypted

  @Column({ type: 'varchar', length: 100 })
  domain!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  proxy?: string;

  @Column({ type: 'int', default: 5060 })
  port!: number;

  @Column({
    type: 'varchar',
    length: 10,
    default: 'udp'
  })
  transport!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'unregistered'
  })
  status!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  displayName?: string;

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'datetime', nullable: true })
  lastRegisteredAt?: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  lastRegisteredIp?: string;

  @Column({ type: 'int', default: 3600 })
  registrationExpires!: number;

  @Column({ type: 'int', default: 5 })
  maxConcurrentCalls!: number;

  @Column({ type: 'int', default: 0 })
  currentActiveCalls!: number;

  @Column({ type: 'int', default: 0 })
  totalCallsMade!: number;

  @Column({ type: 'int', default: 0 })
  totalCallsReceived!: number;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}