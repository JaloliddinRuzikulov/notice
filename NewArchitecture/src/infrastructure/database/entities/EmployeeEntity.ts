/**
 * Employee Entity for TypeORM
 * Maps Employee domain entity to database table
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
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { DepartmentEntity } from './DepartmentEntity';
import { DistrictEntity } from './DistrictEntity';

@Entity('employees')
@Index(['phoneNumber'], { unique: true })
@Index(['department', 'district'])
@Index(['isActive'])
@Index(['lastName', 'firstName'])
export class EmployeeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  middleName?: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phoneNumber!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  additionalPhone?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  position?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  rank?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  photoUrl?: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  // Relations
  @Column({ type: 'varchar', length: 100 })
  department!: string;

  @ManyToOne(() => DepartmentEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'departmentId' })
  departmentEntity?: DepartmentEntity;

  @Column({ type: 'varchar', length: 100 })
  district!: string;

  @ManyToOne(() => DistrictEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'districtId' })
  districtEntity?: DistrictEntity;

  // Timestamps
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Computed column for full name
  @Column({ 
    type: 'varchar', 
    length: 300,
    generatedType: 'STORED',
    asExpression: `lastName || ' ' || firstName || CASE WHEN middleName IS NOT NULL THEN ' ' || middleName ELSE '' END`,
    insert: false,
    update: false,
    nullable: true
  })
  fullName?: string;

  // Soft delete support
  @Column({ type: 'datetime', nullable: true })
  deletedAt?: Date;

  // Metadata
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  // Validation
  @BeforeInsert()
  @BeforeUpdate()
  validatePhoneNumber() {
    if (this.phoneNumber) {
      // Remove all non-numeric characters
      const cleaned = this.phoneNumber.replace(/\D/g, '');
      
      // Validate Uzbek phone format
      if (!cleaned.match(/^998[0-9]{9}$/)) {
        // Try to fix common formats
        if (cleaned.match(/^[0-9]{9}$/)) {
          this.phoneNumber = '998' + cleaned;
        } else if (!cleaned.match(/^998[0-9]{9}$/)) {
          throw new Error(`Invalid phone number format: ${this.phoneNumber}`);
        }
      } else {
        this.phoneNumber = cleaned;
      }
    }

    // Validate additional phone if present
    if (this.additionalPhone) {
      const cleaned = this.additionalPhone.replace(/\D/g, '');
      if (cleaned.match(/^[0-9]{9}$/)) {
        this.additionalPhone = '998' + cleaned;
      } else if (!cleaned.match(/^998[0-9]{9}$/)) {
        throw new Error(`Invalid additional phone format: ${this.additionalPhone}`);
      } else {
        this.additionalPhone = cleaned;
      }
    }
  }
}