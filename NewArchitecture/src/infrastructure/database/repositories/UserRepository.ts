/**
 * User Repository Implementation
 * Concrete implementation of IUserRepository
 */

import { injectable } from 'tsyringe';
import { IsNull, Not, MoreThan, Repository } from 'typeorm';
import { UserEntity, UserRoleDB, UserStatusDB } from '../entities/UserEntity';
import { 
  IUserRepository, 
  UserSearchCriteria 
} from '@/core/domain/repositories/IUserRepository';
import { User, UserRole, UserStatus } from '@/core/domain/entities/User';
import { v4 as uuidv4 } from 'uuid';
import { databaseConnection } from '../connection';

@injectable()
export class UserRepository implements IUserRepository {
  private repository: Repository<UserEntity>;

  constructor() {
    const dataSource = databaseConnection.getDataSource();
    this.repository = dataSource.getRepository(UserEntity);
  }

  // Convert entity to domain model
  private toDomainModel(entity: UserEntity): User {
    return User.create({
      id: entity.id,
      username: entity.username,
      email: entity.email,
      passwordHash: entity.passwordHash,
      firstName: entity.firstName,
      lastName: entity.lastName,
      middleName: entity.middleName,
      role: this.mapRoleToDomain(entity.role),
      status: this.mapStatusToDomain(entity.status),
      district: entity.district,
      department: entity.department,
      phoneNumber: entity.phoneNumber,
      lastLoginAt: entity.lastLoginAt,
      lastLoginIp: entity.lastLoginIp,
      failedLoginAttempts: entity.failedLoginAttempts,
      lockedUntil: entity.lockedUntil,
      permissions: entity.permissions || [],
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  // Convert domain model to entity
  private toEntity(user: User): Partial<UserEntity> {
    const obj = user.toObject();
    return {
      id: obj.id,
      username: obj.username,
      email: obj.email,
      passwordHash: obj.passwordHash,
      firstName: obj.firstName,
      lastName: obj.lastName,
      middleName: obj.middleName,
      role: this.mapRoleToEntity(obj.role),
      status: this.mapStatusToEntity(obj.status),
      district: obj.district,
      department: obj.department,
      phoneNumber: obj.phoneNumber,
      lastLoginAt: obj.lastLoginAt,
      lastLoginIp: obj.lastLoginIp,
      failedLoginAttempts: obj.failedLoginAttempts,
      lockedUntil: obj.lockedUntil,
      permissions: obj.permissions,
      metadata: obj.metadata,
    };
  }

  // Map domain role to entity role
  private mapRoleToEntity(role: UserRole): string {
    const roleMap: Record<UserRole, string> = {
      [UserRole.ADMIN]: 'admin',
      [UserRole.OPERATOR]: 'operator',
      [UserRole.VIEWER]: 'viewer',
      [UserRole.DISTRICT_ADMIN]: 'district_admin',
    };
    return roleMap[role];
  }

  // Map entity role to domain role
  private mapRoleToDomain(role: string): UserRole {
    const roleMap: Record<string, UserRole> = {
      'admin': UserRole.ADMIN,
      'operator': UserRole.OPERATOR,
      'viewer': UserRole.VIEWER,
      'district_admin': UserRole.DISTRICT_ADMIN,
    };
    return roleMap[role] || UserRole.OPERATOR;
  }

  // Map domain status to entity status
  private mapStatusToEntity(status: UserStatus): string {
    const statusMap: Record<UserStatus, string> = {
      [UserStatus.ACTIVE]: 'active',
      [UserStatus.INACTIVE]: 'inactive',
      [UserStatus.SUSPENDED]: 'suspended',
      [UserStatus.PENDING]: 'pending',
    };
    return statusMap[status];
  }

  // Map entity status to domain status
  private mapStatusToDomain(status: string): UserStatus {
    const statusMap: Record<string, UserStatus> = {
      'active': UserStatus.ACTIVE,
      'inactive': UserStatus.INACTIVE,
      'suspended': UserStatus.SUSPENDED,
      'pending': UserStatus.PENDING,
    };
    return statusMap[status] || UserStatus.PENDING;
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { id }
    });
    return entity ? this.toDomainModel(entity) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { username: username.toLowerCase() }
    });
    return entity ? this.toDomainModel(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { email: email.toLowerCase() }
    });
    return entity ? this.toDomainModel(entity) : null;
  }

  async findAll(): Promise<User[]> {
    const entities = await this.repository.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' }
    });
    return entities.map(e => this.toDomainModel(e));
  }

  async save(user: User): Promise<User> {
    const entityData = this.toEntity(user);
    const entity = await this.repository.save(entityData);
    return this.toDomainModel(entity);
  }

  async update(id: string, user: Partial<User>): Promise<User | null> {
    const entityData = this.toEntity(user as User);
    await this.repository.update(id, entityData);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { deletedAt: new Date() });
    return result.affected !== 0;
  }

  // Authentication methods
  async findByCredentials(username: string, passwordHash: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { 
        username: username.toLowerCase(),
        passwordHash,
        deletedAt: IsNull()
      }
    });
    return entity ? this.toDomainModel(entity) : null;
  }

  async updateLastLogin(id: string, ipAddress: string): Promise<boolean> {
    const result = await this.repository.update(id, {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
      failedLoginAttempts: 0
    });
    return result.affected !== 0;
  }

  async updatePassword(id: string, passwordHash: string): Promise<boolean> {
    const result = await this.repository.update(id, { passwordHash });
    return result.affected !== 0;
  }

  async recordFailedLogin(id: string): Promise<boolean> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return false;

    const attempts = entity.failedLoginAttempts + 1;
    const updates: Partial<UserEntity> = { failedLoginAttempts: attempts };

    // Lock account after 5 failed attempts for 30 minutes
    if (attempts >= 5) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 30);
      updates.lockedUntil = lockUntil;
      updates.status = UserStatusDB.SUSPENDED;
    }

    const result = await this.repository.update(id, updates);
    return result.affected !== 0;
  }

  async resetFailedLoginAttempts(id: string): Promise<boolean> {
    const result = await this.repository.update(id, {
      failedLoginAttempts: 0,
      lockedUntil: null
    });
    return result.affected !== 0;
  }

  // Role and permissions
  async findByRole(role: UserRole): Promise<User[]> {
    const entities = await this.repository.find({
      where: { 
        role: this.mapRoleToEntity(role),
        deletedAt: IsNull()
      },
      order: { createdAt: 'DESC' }
    });
    return entities.map(e => this.toDomainModel(e));
  }

  async findByPermission(permission: string): Promise<User[]> {
    const queryBuilder = this.repository.createQueryBuilder('user');
    queryBuilder.where('user.deletedAt IS NULL');
    queryBuilder.andWhere('JSON_CONTAINS(user.permissions, :permission)', {
      permission: JSON.stringify(permission)
    });
    const entities = await queryBuilder.getMany();
    return entities.map(e => this.toDomainModel(e));
  }

  async updateRole(id: string, role: UserRole): Promise<boolean> {
    const result = await this.repository.update(id, { 
      role: this.mapRoleToEntity(role) 
    });
    return result.affected !== 0;
  }

  async addPermission(id: string, permission: string): Promise<boolean> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return false;

    const permissions = entity.permissions || [];
    if (!permissions.includes(permission)) {
      permissions.push(permission);
      const result = await this.repository.update(id, { permissions });
      return result.affected !== 0;
    }
    return true;
  }

  async removePermission(id: string, permission: string): Promise<boolean> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return false;

    const permissions = entity.permissions || [];
    const index = permissions.indexOf(permission);
    if (index > -1) {
      permissions.splice(index, 1);
      const result = await this.repository.update(id, { permissions });
      return result.affected !== 0;
    }
    return true;
  }

  // Status management
  async findByStatus(status: UserStatus): Promise<User[]> {
    const entities = await this.repository.find({
      where: { 
        status: this.mapStatusToEntity(status),
        deletedAt: IsNull()
      },
      order: { createdAt: 'DESC' }
    });
    return entities.map(e => this.toDomainModel(e));
  }

  async activate(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { 
      status: UserStatusDB.ACTIVE 
    });
    return result.affected !== 0;
  }

  async deactivate(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { 
      status: UserStatusDB.INACTIVE 
    });
    return result.affected !== 0;
  }

  async suspend(id: string, until?: Date): Promise<boolean> {
    const result = await this.repository.update(id, { 
      status: UserStatusDB.SUSPENDED,
      lockedUntil: until
    });
    return result.affected !== 0;
  }

  async unlock(id: string): Promise<boolean> {
    const result = await this.repository.update(id, {
      status: UserStatusDB.ACTIVE,
      lockedUntil: null,
      failedLoginAttempts: 0
    });
    return result.affected !== 0;
  }

  // District/Department
  async findByDistrict(district: string): Promise<User[]> {
    const entities = await this.repository.find({
      where: { 
        district,
        deletedAt: IsNull()
      },
      order: { createdAt: 'DESC' }
    });
    return entities.map(e => this.toDomainModel(e));
  }

  async findByDepartment(department: string): Promise<User[]> {
    const entities = await this.repository.find({
      where: { 
        department,
        deletedAt: IsNull()
      },
      order: { createdAt: 'DESC' }
    });
    return entities.map(e => this.toDomainModel(e));
  }

  async updateDistrict(id: string, district: string): Promise<boolean> {
    const result = await this.repository.update(id, { district });
    return result.affected !== 0;
  }

  async updateDepartment(id: string, department: string): Promise<boolean> {
    const result = await this.repository.update(id, { department });
    return result.affected !== 0;
  }

  // Search and filtering
  async search(criteria: UserSearchCriteria): Promise<User[]> {
    const queryBuilder = this.repository.createQueryBuilder('user');

    if (criteria.username) {
      queryBuilder.andWhere('user.username LIKE :username', { 
        username: `%${criteria.username.toLowerCase()}%` 
      });
    }

    if (criteria.email) {
      queryBuilder.andWhere('user.email LIKE :email', { 
        email: `%${criteria.email.toLowerCase()}%` 
      });
    }

    if (criteria.firstName) {
      queryBuilder.andWhere('user.firstName LIKE :firstName', { 
        firstName: `%${criteria.firstName}%` 
      });
    }

    if (criteria.lastName) {
      queryBuilder.andWhere('user.lastName LIKE :lastName', { 
        lastName: `%${criteria.lastName}%` 
      });
    }

    if (criteria.role) {
      queryBuilder.andWhere('user.role = :role', { 
        role: this.mapRoleToEntity(criteria.role) 
      });
    }

    if (criteria.status) {
      queryBuilder.andWhere('user.status = :status', { 
        status: this.mapStatusToEntity(criteria.status) 
      });
    }

    if (criteria.district) {
      queryBuilder.andWhere('user.district = :district', { 
        district: criteria.district 
      });
    }

    if (criteria.department) {
      queryBuilder.andWhere('user.department = :department', { 
        department: criteria.department 
      });
    }

    queryBuilder.andWhere('user.deletedAt IS NULL');
    queryBuilder.orderBy('user.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();
    return entities.map(e => this.toDomainModel(e));
  }

  async findActiveUsers(): Promise<User[]> {
    const entities = await this.repository.find({
      where: {
        status: UserStatusDB.ACTIVE,
        deletedAt: IsNull()
      },
      order: { createdAt: 'DESC' }
    });
    return entities.map(e => this.toDomainModel(e));
  }

  async findInactiveUsers(): Promise<User[]> {
    const entities = await this.repository.find({
      where: {
        status: UserStatusDB.INACTIVE,
        deletedAt: IsNull()
      },
      order: { createdAt: 'DESC' }
    });
    return entities.map(e => this.toDomainModel(e));
  }

  async findLockedUsers(): Promise<User[]> {
    const entities = await this.repository.find({
      where: {
        lockedUntil: MoreThan(new Date()),
        deletedAt: IsNull()
      },
      order: { createdAt: 'DESC' }
    });
    return entities.map(e => this.toDomainModel(e));
  }

  // Statistics
  async countByRole(): Promise<Record<string, number>> {
    const result = await this.repository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .where('user.deletedAt IS NULL')
      .groupBy('user.role')
      .getRawMany();

    return result.reduce((acc, row) => {
      const domainRole = this.mapRoleToDomain(row.role);
      acc[domainRole] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);
  }

  async countByStatus(): Promise<Record<string, number>> {
    const result = await this.repository
      .createQueryBuilder('user')
      .select('user.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('user.deletedAt IS NULL')
      .groupBy('user.status')
      .getRawMany();

    return result.reduce((acc, row) => {
      const domainStatus = this.mapStatusToDomain(row.status);
      acc[domainStatus] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);
  }

  async countByDistrict(): Promise<Record<string, number>> {
    const result = await this.repository
      .createQueryBuilder('user')
      .select('user.district', 'district')
      .addSelect('COUNT(*)', 'count')
      .where('user.deletedAt IS NULL')
      .andWhere('user.district IS NOT NULL')
      .groupBy('user.district')
      .getRawMany();

    return result.reduce((acc, row) => {
      acc[row.district] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);
  }

  async countTotal(): Promise<number> {
    return this.repository.count({
      where: { deletedAt: IsNull() }
    });
  }

  async countActive(): Promise<number> {
    return this.repository.count({
      where: {
        status: UserStatusDB.ACTIVE,
        deletedAt: IsNull()
      }
    });
  }

  // Session management
  async findActiveSession(userId: string): Promise<any> {
    const entity = await this.repository.findOne({
      where: {
        id: userId,
        currentSessionId: Not(IsNull()),
        sessionExpiresAt: MoreThan(new Date())
      }
    });

    if (!entity || !entity.currentSessionId) return null;

    return {
      sessionId: entity.currentSessionId,
      userId: entity.id,
      expiresAt: entity.sessionExpiresAt
    };
  }

  async createSession(userId: string, sessionData: any): Promise<string> {
    const sessionId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour sessions

    await this.repository.update(userId, {
      currentSessionId: sessionId,
      sessionExpiresAt: expiresAt
    });

    return sessionId;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const result = await this.repository.update(
      { currentSessionId: sessionId },
      { currentSessionId: null, sessionExpiresAt: null }
    );
    return result.affected !== 0;
  }

  async deleteUserSessions(userId: string): Promise<number> {
    const result = await this.repository.update(userId, {
      currentSessionId: null,
      sessionExpiresAt: null
    });
    return result.affected || 0;
  }

  // Check existence
  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await this.repository.count({ where: { username: username.toLowerCase() } });
    return count > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.repository.count({ where: { email: email.toLowerCase() } });
    return count > 0;
  }
}