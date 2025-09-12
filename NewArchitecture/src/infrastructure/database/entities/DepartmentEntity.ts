/**
 * Department Entity for TypeORM
 * Maps Department domain entity to database table
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  Tree,
  TreeChildren,
  TreeParent,
} from 'typeorm';
import { EmployeeEntity } from './EmployeeEntity';

@Entity('departments')
@Tree('closure-table')
@Index(['code'], { unique: true })
@Index(['name'])
@Index(['level'])
@Index(['isActive'])
export class DepartmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', default: 0 })
  level!: number;

  @Column({ type: 'int', nullable: true })
  order?: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'int', default: 0 })
  employeeCount!: number;

  // Tree structure
  @TreeParent()
  parent?: DepartmentEntity;

  @TreeChildren()
  children?: DepartmentEntity[];

  @Column({ type: 'uuid', nullable: true })
  parentId?: string;

  // Relations
  @OneToMany(() => EmployeeEntity, employee => employee.departmentEntity)
  employees?: EmployeeEntity[];

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

  // Contact information
  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneNumber?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  // Head of department
  @Column({ type: 'varchar', length: 200, nullable: true })
  headName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  headPosition?: string;
}