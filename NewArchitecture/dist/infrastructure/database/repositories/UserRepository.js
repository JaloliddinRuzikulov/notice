"use strict";
/**
 * User Repository Implementation
 * Concrete implementation of IUserRepository
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const tsyringe_1 = require("tsyringe");
const typeorm_1 = require("typeorm");
const UserEntity_1 = require("../entities/UserEntity");
const User_1 = require("@/core/domain/entities/User");
const uuid_1 = require("uuid");
const connection_1 = require("../connection");
let UserRepository = class UserRepository {
    repository;
    constructor() {
        const dataSource = connection_1.databaseConnection.getDataSource();
        this.repository = dataSource.getRepository(UserEntity_1.UserEntity);
    }
    // Convert entity to domain model
    toDomainModel(entity) {
        return User_1.User.create({
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
    toEntity(user) {
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
    mapRoleToEntity(role) {
        const roleMap = {
            [User_1.UserRole.ADMIN]: UserEntity_1.UserRoleDB.ADMIN,
            [User_1.UserRole.OPERATOR]: UserEntity_1.UserRoleDB.OPERATOR,
            [User_1.UserRole.VIEWER]: UserEntity_1.UserRoleDB.VIEWER,
            [User_1.UserRole.DISTRICT_ADMIN]: UserEntity_1.UserRoleDB.DISTRICT_ADMIN,
        };
        return roleMap[role];
    }
    // Map entity role to domain role
    mapRoleToDomain(role) {
        const roleMap = {
            [UserEntity_1.UserRoleDB.ADMIN]: User_1.UserRole.ADMIN,
            [UserEntity_1.UserRoleDB.OPERATOR]: User_1.UserRole.OPERATOR,
            [UserEntity_1.UserRoleDB.VIEWER]: User_1.UserRole.VIEWER,
            [UserEntity_1.UserRoleDB.DISTRICT_ADMIN]: User_1.UserRole.DISTRICT_ADMIN,
        };
        return roleMap[role];
    }
    // Map domain status to entity status
    mapStatusToEntity(status) {
        const statusMap = {
            [User_1.UserStatus.ACTIVE]: UserEntity_1.UserStatusDB.ACTIVE,
            [User_1.UserStatus.INACTIVE]: UserEntity_1.UserStatusDB.INACTIVE,
            [User_1.UserStatus.SUSPENDED]: UserEntity_1.UserStatusDB.SUSPENDED,
            [User_1.UserStatus.PENDING]: UserEntity_1.UserStatusDB.PENDING,
        };
        return statusMap[status];
    }
    // Map entity status to domain status
    mapStatusToDomain(status) {
        const statusMap = {
            [UserEntity_1.UserStatusDB.ACTIVE]: User_1.UserStatus.ACTIVE,
            [UserEntity_1.UserStatusDB.INACTIVE]: User_1.UserStatus.INACTIVE,
            [UserEntity_1.UserStatusDB.SUSPENDED]: User_1.UserStatus.SUSPENDED,
            [UserEntity_1.UserStatusDB.PENDING]: User_1.UserStatus.PENDING,
        };
        return statusMap[status];
    }
    async findById(id) {
        const entity = await this.repository.findOne({
            where: { id }
        });
        return entity ? this.toDomainModel(entity) : null;
    }
    async findByUsername(username) {
        const entity = await this.repository.findOne({
            where: { username: username.toLowerCase() }
        });
        return entity ? this.toDomainModel(entity) : null;
    }
    async findByEmail(email) {
        const entity = await this.repository.findOne({
            where: { email: email.toLowerCase() }
        });
        return entity ? this.toDomainModel(entity) : null;
    }
    async findAll() {
        const entities = await this.repository.find({
            where: { deletedAt: (0, typeorm_1.IsNull)() },
            order: { createdAt: 'DESC' }
        });
        return entities.map(e => this.toDomainModel(e));
    }
    async save(user) {
        const entityData = this.toEntity(user);
        const entity = await this.repository.save(entityData);
        return this.toDomainModel(entity);
    }
    async update(id, user) {
        const entityData = this.toEntity(user);
        await this.repository.update(id, entityData);
        return this.findById(id);
    }
    async delete(id) {
        const result = await this.repository.update(id, { deletedAt: new Date() });
        return result.affected !== 0;
    }
    // Authentication methods
    async findByCredentials(username, passwordHash) {
        const entity = await this.repository.findOne({
            where: {
                username: username.toLowerCase(),
                passwordHash,
                deletedAt: (0, typeorm_1.IsNull)()
            }
        });
        return entity ? this.toDomainModel(entity) : null;
    }
    async updateLastLogin(id, ipAddress) {
        const result = await this.repository.update(id, {
            lastLoginAt: new Date(),
            lastLoginIp: ipAddress,
            failedLoginAttempts: 0
        });
        return result.affected !== 0;
    }
    async updatePassword(id, passwordHash) {
        const result = await this.repository.update(id, { passwordHash });
        return result.affected !== 0;
    }
    async recordFailedLogin(id) {
        const entity = await this.repository.findOne({ where: { id } });
        if (!entity)
            return false;
        const attempts = entity.failedLoginAttempts + 1;
        const updates = { failedLoginAttempts: attempts };
        // Lock account after 5 failed attempts for 30 minutes
        if (attempts >= 5) {
            const lockUntil = new Date();
            lockUntil.setMinutes(lockUntil.getMinutes() + 30);
            updates.lockedUntil = lockUntil;
            updates.status = UserEntity_1.UserStatusDB.SUSPENDED;
        }
        const result = await this.repository.update(id, updates);
        return result.affected !== 0;
    }
    async resetFailedLoginAttempts(id) {
        const result = await this.repository.update(id, {
            failedLoginAttempts: 0,
            lockedUntil: null
        });
        return result.affected !== 0;
    }
    // Role and permissions
    async findByRole(role) {
        const entities = await this.repository.find({
            where: {
                role: this.mapRoleToEntity(role),
                deletedAt: (0, typeorm_1.IsNull)()
            },
            order: { createdAt: 'DESC' }
        });
        return entities.map(e => this.toDomainModel(e));
    }
    async findByPermission(permission) {
        const queryBuilder = this.repository.createQueryBuilder('user');
        queryBuilder.where('user.deletedAt IS NULL');
        queryBuilder.andWhere('JSON_CONTAINS(user.permissions, :permission)', {
            permission: JSON.stringify(permission)
        });
        const entities = await queryBuilder.getMany();
        return entities.map(e => this.toDomainModel(e));
    }
    async updateRole(id, role) {
        const result = await this.repository.update(id, {
            role: this.mapRoleToEntity(role)
        });
        return result.affected !== 0;
    }
    async addPermission(id, permission) {
        const entity = await this.repository.findOne({ where: { id } });
        if (!entity)
            return false;
        const permissions = entity.permissions || [];
        if (!permissions.includes(permission)) {
            permissions.push(permission);
            const result = await this.repository.update(id, { permissions });
            return result.affected !== 0;
        }
        return true;
    }
    async removePermission(id, permission) {
        const entity = await this.repository.findOne({ where: { id } });
        if (!entity)
            return false;
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
    async findByStatus(status) {
        const entities = await this.repository.find({
            where: {
                status: this.mapStatusToEntity(status),
                deletedAt: (0, typeorm_1.IsNull)()
            },
            order: { createdAt: 'DESC' }
        });
        return entities.map(e => this.toDomainModel(e));
    }
    async activate(id) {
        const result = await this.repository.update(id, {
            status: UserEntity_1.UserStatusDB.ACTIVE
        });
        return result.affected !== 0;
    }
    async deactivate(id) {
        const result = await this.repository.update(id, {
            status: UserEntity_1.UserStatusDB.INACTIVE
        });
        return result.affected !== 0;
    }
    async suspend(id, until) {
        const result = await this.repository.update(id, {
            status: UserEntity_1.UserStatusDB.SUSPENDED,
            lockedUntil: until
        });
        return result.affected !== 0;
    }
    async unlock(id) {
        const result = await this.repository.update(id, {
            status: UserEntity_1.UserStatusDB.ACTIVE,
            lockedUntil: null,
            failedLoginAttempts: 0
        });
        return result.affected !== 0;
    }
    // District/Department
    async findByDistrict(district) {
        const entities = await this.repository.find({
            where: {
                district,
                deletedAt: (0, typeorm_1.IsNull)()
            },
            order: { createdAt: 'DESC' }
        });
        return entities.map(e => this.toDomainModel(e));
    }
    async findByDepartment(department) {
        const entities = await this.repository.find({
            where: {
                department,
                deletedAt: (0, typeorm_1.IsNull)()
            },
            order: { createdAt: 'DESC' }
        });
        return entities.map(e => this.toDomainModel(e));
    }
    async updateDistrict(id, district) {
        const result = await this.repository.update(id, { district });
        return result.affected !== 0;
    }
    async updateDepartment(id, department) {
        const result = await this.repository.update(id, { department });
        return result.affected !== 0;
    }
    // Search and filtering
    async search(criteria) {
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
    async findActiveUsers() {
        const entities = await this.repository.find({
            where: {
                status: UserEntity_1.UserStatusDB.ACTIVE,
                deletedAt: (0, typeorm_1.IsNull)()
            },
            order: { createdAt: 'DESC' }
        });
        return entities.map(e => this.toDomainModel(e));
    }
    async findInactiveUsers() {
        const entities = await this.repository.find({
            where: {
                status: UserEntity_1.UserStatusDB.INACTIVE,
                deletedAt: (0, typeorm_1.IsNull)()
            },
            order: { createdAt: 'DESC' }
        });
        return entities.map(e => this.toDomainModel(e));
    }
    async findLockedUsers() {
        const entities = await this.repository.find({
            where: {
                lockedUntil: (0, typeorm_1.MoreThan)(new Date()),
                deletedAt: (0, typeorm_1.IsNull)()
            },
            order: { createdAt: 'DESC' }
        });
        return entities.map(e => this.toDomainModel(e));
    }
    // Statistics
    async countByRole() {
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
        }, {});
    }
    async countByStatus() {
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
        }, {});
    }
    async countByDistrict() {
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
        }, {});
    }
    async countTotal() {
        return this.repository.count({
            where: { deletedAt: (0, typeorm_1.IsNull)() }
        });
    }
    async countActive() {
        return this.repository.count({
            where: {
                status: UserEntity_1.UserStatusDB.ACTIVE,
                deletedAt: (0, typeorm_1.IsNull)()
            }
        });
    }
    // Session management
    async findActiveSession(userId) {
        const entity = await this.repository.findOne({
            where: {
                id: userId,
                currentSessionId: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()),
                sessionExpiresAt: (0, typeorm_1.MoreThan)(new Date())
            }
        });
        if (!entity || !entity.currentSessionId)
            return null;
        return {
            sessionId: entity.currentSessionId,
            userId: entity.id,
            expiresAt: entity.sessionExpiresAt
        };
    }
    async createSession(userId, sessionData) {
        const sessionId = (0, uuid_1.v4)();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour sessions
        await this.repository.update(userId, {
            currentSessionId: sessionId,
            sessionExpiresAt: expiresAt
        });
        return sessionId;
    }
    async deleteSession(sessionId) {
        const result = await this.repository.update({ currentSessionId: sessionId }, { currentSessionId: null, sessionExpiresAt: null });
        return result.affected !== 0;
    }
    async deleteUserSessions(userId) {
        const result = await this.repository.update(userId, {
            currentSessionId: null,
            sessionExpiresAt: null
        });
        return result.affected || 0;
    }
    // Check existence
    async exists(id) {
        const count = await this.repository.count({ where: { id } });
        return count > 0;
    }
    async existsByUsername(username) {
        const count = await this.repository.count({ where: { username: username.toLowerCase() } });
        return count > 0;
    }
    async existsByEmail(email) {
        const count = await this.repository.count({ where: { email: email.toLowerCase() } });
        return count > 0;
    }
};
exports.UserRepository = UserRepository;
exports.UserRepository = UserRepository = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [])
], UserRepository);
//# sourceMappingURL=UserRepository.js.map