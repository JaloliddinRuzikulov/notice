/**
 * District Entity for TypeORM
 * Maps District domain entity to database table
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { EmployeeEntity } from './EmployeeEntity';

@Entity('districts')
@Index(['code'], { unique: true })
@Index(['name'])
@Index(['region'])
@Index(['isActive'])
export class DistrictEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  region?: string;

  @Column({ type: 'int', nullable: true })
  population?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area?: number; // square kilometers

  @Column({ type: 'varchar', length: 100, nullable: true })
  center?: string; // District center/capital

  @Column({ type: 'int', default: 0 })
  employeeCount!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  // Relations
  @OneToMany(() => EmployeeEntity, employee => employee.districtEntity)
  employees?: EmployeeEntity[];

  // Geographic coordinates
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number;

  // Administrative info
  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneCode?: string;

  // Statistics
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  populationDensity?: number; // people per sq km

  @Column({ type: 'int', nullable: true })
  numberOfVillages?: number;

  @Column({ type: 'int', nullable: true })
  numberOfMahallas?: number;

  // Economic indicators
  @Column({ type: 'varchar', length: 100, nullable: true })
  economicActivity?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  budget?: number;

  // Leadership
  @Column({ type: 'varchar', length: 200, nullable: true })
  hokimName?: string; // District governor

  @Column({ type: 'varchar', length: 20, nullable: true })
  hokimPhone?: string;

  // Police department info
  @Column({ type: 'varchar', length: 200, nullable: true })
  policeChiefName?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  policePhone?: string;

  @Column({ type: 'text', nullable: true })
  policeAddress?: string;

  // Metadata
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  // Timestamps
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Soft delete
  @Column({ type: 'datetime', nullable: true })
  deletedAt?: Date;
}