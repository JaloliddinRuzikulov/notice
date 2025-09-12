/**
 * Group Entity for TypeORM
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum GroupTypeDB {
  STATIC = 'static',
  DYNAMIC = 'dynamic',
  DEPARTMENT = 'department',
  DISTRICT = 'district',
  CUSTOM = 'custom'
}

@Entity('groups')
@Index(['name'])
@Index(['type'])
@Index(['createdBy'])
export class GroupEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'static'
  })
  type!: string;

  @Column({ type: 'json' })
  members!: Array<{
    employeeId: string;
    name: string;
    phoneNumber: string;
    addedAt: Date;
    addedBy: string;
  }>;

  @Column({ type: 'json', nullable: true })
  departmentIds?: string[];

  @Column({ type: 'json', nullable: true })
  districtIds?: string[];

  @Column({ type: 'varchar', length: 255 })
  createdBy!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}