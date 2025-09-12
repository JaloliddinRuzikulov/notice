/**
 * Employee Repository Implementation
 * Concrete implementation of IEmployeeRepository
 */

import { injectable } from 'tsyringe';
import { IsNull, Repository } from 'typeorm';
import { EmployeeEntity } from '../entities/EmployeeEntity';
import { 
  IEmployeeRepository, 
  EmployeeSearchCriteria, 
  PaginationOptions, 
  PaginatedResult 
} from '@/core/domain/repositories/IEmployeeRepository';
import { Employee } from '@/core/domain/entities/Employee';
import { databaseConnection } from '../connection';

@injectable()
export class EmployeeRepository implements IEmployeeRepository {
  private repository: Repository<EmployeeEntity>;

  constructor() {
    const dataSource = databaseConnection.getDataSource();
    this.repository = dataSource.getRepository(EmployeeEntity);
  }

  // Convert entity to domain model
  private toDomainModel(entity: EmployeeEntity): Employee {
    return Employee.create({
      id: entity.id,
      firstName: entity.firstName,
      lastName: entity.lastName,
      middleName: entity.middleName,
      phoneNumber: entity.phoneNumber,
      additionalPhone: entity.additionalPhone,
      department: entity.department,
      district: entity.district,
      position: entity.position,
      rank: entity.rank,
      notes: entity.notes,
      photoUrl: entity.photoUrl,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  // Convert domain model to entity
  private toEntity(employee: Employee): Partial<EmployeeEntity> {
    const obj = employee.toObject();
    return {
      id: obj.id,
      firstName: obj.firstName,
      lastName: obj.lastName,
      middleName: obj.middleName,
      phoneNumber: obj.phoneNumber,
      additionalPhone: obj.additionalPhone,
      department: obj.department,
      district: obj.district,
      position: obj.position,
      rank: obj.rank,
      notes: obj.notes,
      photoUrl: obj.photoUrl,
      isActive: obj.isActive,
    };
  }

  // IEmployeeRepository implementation methods
  async findById(id: string): Promise<Employee | null> {
    const entity = await this.repository.findOne({
      where: { id } as any
    });
    return entity ? this.toDomainModel(entity) : null;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Employee | null> {
    const entity = await this.repository.findOne({
      where: { phoneNumber }
    });
    return entity ? this.toDomainModel(entity) : null;
  }

  async findAll(): Promise<Employee[]> {
    const entities = await this.repository.find({
      where: { deletedAt: IsNull() },
      order: { lastName: 'ASC', firstName: 'ASC' }
    });
    return entities.map(e => this.toDomainModel(e));
  }

  async save(employee: Employee): Promise<Employee> {
    const entityData = this.toEntity(employee);
    const entity = await this.repository.save(entityData as any);
    return this.toDomainModel(entity);
  }

  async update(id: string, employee: Partial<Employee>): Promise<Employee | null> {
    const entityData = this.toEntity(employee as Employee);
    await this.repository.update(id, entityData as any);
    return this.findById(id);
  }

  async search(criteria: EmployeeSearchCriteria): Promise<Employee[]> {
    const queryBuilder = this.repository.createQueryBuilder('employee');

    if (criteria.name) {
      queryBuilder.andWhere(
        '(employee.firstName LIKE :name OR employee.lastName LIKE :name OR employee.middleName LIKE :name)',
        { name: `%${criteria.name}%` }
      );
    }

    if (criteria.department) {
      queryBuilder.andWhere('employee.department = :department', { 
        department: criteria.department 
      });
    }

    if (criteria.district) {
      queryBuilder.andWhere('employee.district = :district', { 
        district: criteria.district 
      });
    }

    if (criteria.position) {
      queryBuilder.andWhere('employee.position LIKE :position', { 
        position: `%${criteria.position}%` 
      });
    }

    if (criteria.rank) {
      queryBuilder.andWhere('employee.rank = :rank', { 
        rank: criteria.rank 
      });
    }

    if (criteria.phoneNumber) {
      queryBuilder.andWhere(
        '(employee.phoneNumber LIKE :phone OR employee.additionalPhone LIKE :phone)',
        { phone: `%${criteria.phoneNumber}%` }
      );
    }

    if (criteria.isActive !== undefined) {
      queryBuilder.andWhere('employee.isActive = :isActive', { 
        isActive: criteria.isActive 
      });
    }

    queryBuilder.andWhere('employee.deletedAt IS NULL');
    queryBuilder.orderBy('employee.lastName', 'ASC');
    queryBuilder.addOrderBy('employee.firstName', 'ASC');

    const entities = await queryBuilder.getMany();
    return entities.map(e => this.toDomainModel(e));
  }

  async findByDepartment(department: string): Promise<Employee[]> {
    const entities = await this.repository.find({
      where: { 
        department,
        deletedAt: IsNull()
      },
      order: { lastName: 'ASC', firstName: 'ASC' }
    });
    return entities.map(e => this.toDomainModel(e));
  }

  async findByDistrict(district: string): Promise<Employee[]> {
    const entities = await this.repository.find({
      where: { 
        district,
        deletedAt: IsNull()
      },
      order: { lastName: 'ASC', firstName: 'ASC' }
    });
    return entities.map(e => this.toDomainModel(e));
  }

  async findByDepartmentAndDistrict(department: string, district: string): Promise<Employee[]> {
    const entities = await this.repository.find({
      where: { 
        department,
        district,
        deletedAt: IsNull()
      },
      order: { lastName: 'ASC', firstName: 'ASC' }
    });
    return entities.map(e => this.toDomainModel(e));
  }

  async findPaginated(options: PaginationOptions): Promise<PaginatedResult<Employee>> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    const [entities, total] = await this.repository.findAndCount({
      where: { deletedAt: IsNull() },
      order: { 
        [options.sortBy || 'lastName']: options.sortOrder || 'ASC' 
      },
      skip: offset,
      take: limit
    });

    return {
      data: entities.map((e: EmployeeEntity) => this.toDomainModel(e)),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async searchPaginated(
    criteria: EmployeeSearchCriteria,
    options: PaginationOptions
  ): Promise<PaginatedResult<Employee>> {
    const queryBuilder = this.repository.createQueryBuilder('employee');

    // Apply search criteria (same as search method)
    if (criteria.name) {
      queryBuilder.andWhere(
        '(employee.firstName LIKE :name OR employee.lastName LIKE :name OR employee.middleName LIKE :name)',
        { name: `%${criteria.name}%` }
      );
    }

    if (criteria.department) {
      queryBuilder.andWhere('employee.department = :department', { 
        department: criteria.department 
      });
    }

    if (criteria.district) {
      queryBuilder.andWhere('employee.district = :district', { 
        district: criteria.district 
      });
    }

    queryBuilder.andWhere('employee.deletedAt IS NULL');

    // Apply pagination
    const skip = (options.page - 1) * options.limit;
    queryBuilder.skip(skip).take(options.limit);

    // Apply sorting
    queryBuilder.orderBy(
      `employee.${options.sortBy || 'lastName'}`,
      options.sortOrder || 'ASC'
    );

    const [entities, total] = await queryBuilder.getManyAndCount();

    return {
      data: entities.map(e => this.toDomainModel(e)),
      total,
      page: options.page,
      totalPages: Math.ceil(total / options.limit)
    };
  }

  async saveMany(employees: Employee[]): Promise<Employee[]> {
    const entityData = employees.map(e => this.toEntity(e));
    const entities = await this.repository.save(entityData as any);
    return entities.map((e: EmployeeEntity) => this.toDomainModel(e));
  }

  async updateMany(updates: Array<{ id: string; data: Partial<Employee> }>): Promise<number> {
    let count = 0;
    
    for (const update of updates) {
      const result = await this.repository.update(
        update.id,
        this.toEntity(update.data as Employee) as any
      );
      count += result.affected || 0;
    }

    return count;
  }

  async countByDepartment(): Promise<Record<string, number>> {
    const result = await this.repository
      .createQueryBuilder('employee')
      .select('employee.department', 'department')
      .addSelect('COUNT(*)', 'count')
      .where('employee.deletedAt IS NULL')
      .andWhere('employee.isActive = true')
      .groupBy('employee.department')
      .getRawMany();

    return result.reduce((acc, row) => {
      acc[row.department] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);
  }

  async countByDistrict(): Promise<Record<string, number>> {
    const result = await this.repository
      .createQueryBuilder('employee')
      .select('employee.district', 'district')
      .addSelect('COUNT(*)', 'count')
      .where('employee.deletedAt IS NULL')
      .andWhere('employee.isActive = true')
      .groupBy('employee.district')
      .getRawMany();

    return result.reduce((acc, row) => {
      acc[row.district] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);
  }

  async countActive(): Promise<number> {
    return this.repository.count({
      where: {
        isActive: true,
        deletedAt: IsNull()
      }
    });
  }

  async countTotal(): Promise<number> {
    return this.repository.count({
      where: { deletedAt: IsNull() }
    });
  }

  async findActiveEmployees(): Promise<Employee[]> {
    const entities = await this.repository.find({
      where: {
        isActive: true,
        deletedAt: IsNull()
      },
      order: { lastName: 'ASC', firstName: 'ASC' }
    });
    return entities.map(e => this.toDomainModel(e));
  }

  async findInactiveEmployees(): Promise<Employee[]> {
    const entities = await this.repository.find({
      where: {
        isActive: false,
        deletedAt: IsNull()
      },
      order: { lastName: 'ASC', firstName: 'ASC' }
    });
    return entities.map(e => this.toDomainModel(e));
  }

  async activateEmployee(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { isActive: true });
    return result.affected !== 0;
  }

  async deactivateEmployee(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { isActive: false });
    return result.affected !== 0;
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } as any });
    return count > 0;
  }

  async existsByPhoneNumber(phoneNumber: string): Promise<boolean> {
    const count = await this.repository.count({ where: { phoneNumber } as any });
    return count > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  async deleteMany(ids: string[]): Promise<number> {
    let count = 0;
    for (const id of ids) {
      const result = await this.repository.delete(id);
      count += result.affected || 0;
    }
    return count;
  }
}