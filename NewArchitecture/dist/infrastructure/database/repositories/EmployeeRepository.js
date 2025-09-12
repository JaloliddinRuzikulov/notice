"use strict";
/**
 * Employee Repository Implementation
 * Concrete implementation of IEmployeeRepository
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
exports.EmployeeRepository = void 0;
const tsyringe_1 = require("tsyringe");
const typeorm_1 = require("typeorm");
const EmployeeEntity_1 = require("../entities/EmployeeEntity");
const Employee_1 = require("@/core/domain/entities/Employee");
const connection_1 = require("../connection");
let EmployeeRepository = class EmployeeRepository {
    repository;
    constructor() {
        const dataSource = connection_1.databaseConnection.getDataSource();
        this.repository = dataSource.getRepository(EmployeeEntity_1.EmployeeEntity);
    }
    // Convert entity to domain model
    toDomainModel(entity) {
        return Employee_1.Employee.create({
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
    toEntity(employee) {
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
    async findById(id) {
        const entity = await this.repository.findOne({
            where: { id }
        });
        return entity ? this.toDomainModel(entity) : null;
    }
    async findByPhoneNumber(phoneNumber) {
        const entity = await this.repository.findOne({
            where: { phoneNumber }
        });
        return entity ? this.toDomainModel(entity) : null;
    }
    async findAll() {
        const entities = await this.repository.find({
            where: { deletedAt: (0, typeorm_1.IsNull)() },
            order: { lastName: 'ASC', firstName: 'ASC' }
        });
        return entities.map(e => this.toDomainModel(e));
    }
    async save(employee) {
        const entityData = this.toEntity(employee);
        const entity = await this.repository.save(entityData);
        return this.toDomainModel(entity);
    }
    async update(id, employee) {
        const entityData = this.toEntity(employee);
        await this.repository.update(id, entityData);
        return this.findById(id);
    }
    async search(criteria) {
        const queryBuilder = this.repository.createQueryBuilder('employee');
        if (criteria.name) {
            queryBuilder.andWhere('(employee.firstName LIKE :name OR employee.lastName LIKE :name OR employee.middleName LIKE :name)', { name: `%${criteria.name}%` });
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
            queryBuilder.andWhere('(employee.phoneNumber LIKE :phone OR employee.additionalPhone LIKE :phone)', { phone: `%${criteria.phoneNumber}%` });
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
    async findByDepartment(department) {
        const entities = await this.repository.find({
            where: {
                department,
                deletedAt: (0, typeorm_1.IsNull)()
            },
            order: { lastName: 'ASC', firstName: 'ASC' }
        });
        return entities.map(e => this.toDomainModel(e));
    }
    async findByDistrict(district) {
        const entities = await this.repository.find({
            where: {
                district,
                deletedAt: (0, typeorm_1.IsNull)()
            },
            order: { lastName: 'ASC', firstName: 'ASC' }
        });
        return entities.map(e => this.toDomainModel(e));
    }
    async findByDepartmentAndDistrict(department, district) {
        const entities = await this.repository.find({
            where: {
                department,
                district,
                deletedAt: (0, typeorm_1.IsNull)()
            },
            order: { lastName: 'ASC', firstName: 'ASC' }
        });
        return entities.map(e => this.toDomainModel(e));
    }
    async findPaginated(options) {
        const page = options.page || 1;
        const limit = options.limit || 10;
        const offset = (page - 1) * limit;
        const [entities, total] = await this.repository.findAndCount({
            where: { deletedAt: (0, typeorm_1.IsNull)() },
            order: {
                [options.sortBy || 'lastName']: options.sortOrder || 'ASC'
            },
            skip: offset,
            take: limit
        });
        return {
            data: entities.map((e) => this.toDomainModel(e)),
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }
    async searchPaginated(criteria, options) {
        const queryBuilder = this.repository.createQueryBuilder('employee');
        // Apply search criteria (same as search method)
        if (criteria.name) {
            queryBuilder.andWhere('(employee.firstName LIKE :name OR employee.lastName LIKE :name OR employee.middleName LIKE :name)', { name: `%${criteria.name}%` });
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
        queryBuilder.orderBy(`employee.${options.sortBy || 'lastName'}`, options.sortOrder || 'ASC');
        const [entities, total] = await queryBuilder.getManyAndCount();
        return {
            data: entities.map(e => this.toDomainModel(e)),
            total,
            page: options.page,
            totalPages: Math.ceil(total / options.limit)
        };
    }
    async saveMany(employees) {
        const entityData = employees.map(e => this.toEntity(e));
        const entities = await this.repository.save(entityData);
        return entities.map((e) => this.toDomainModel(e));
    }
    async updateMany(updates) {
        let count = 0;
        for (const update of updates) {
            const result = await this.repository.update(update.id, this.toEntity(update.data));
            count += result.affected || 0;
        }
        return count;
    }
    async countByDepartment() {
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
        }, {});
    }
    async countByDistrict() {
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
        }, {});
    }
    async countActive() {
        return this.repository.count({
            where: {
                isActive: true,
                deletedAt: (0, typeorm_1.IsNull)()
            }
        });
    }
    async countTotal() {
        return this.repository.count({
            where: { deletedAt: (0, typeorm_1.IsNull)() }
        });
    }
    async findActiveEmployees() {
        const entities = await this.repository.find({
            where: {
                isActive: true,
                deletedAt: (0, typeorm_1.IsNull)()
            },
            order: { lastName: 'ASC', firstName: 'ASC' }
        });
        return entities.map(e => this.toDomainModel(e));
    }
    async findInactiveEmployees() {
        const entities = await this.repository.find({
            where: {
                isActive: false,
                deletedAt: (0, typeorm_1.IsNull)()
            },
            order: { lastName: 'ASC', firstName: 'ASC' }
        });
        return entities.map(e => this.toDomainModel(e));
    }
    async activateEmployee(id) {
        const result = await this.repository.update(id, { isActive: true });
        return result.affected !== 0;
    }
    async deactivateEmployee(id) {
        const result = await this.repository.update(id, { isActive: false });
        return result.affected !== 0;
    }
    async exists(id) {
        const count = await this.repository.count({ where: { id } });
        return count > 0;
    }
    async existsByPhoneNumber(phoneNumber) {
        const count = await this.repository.count({ where: { phoneNumber } });
        return count > 0;
    }
    async delete(id) {
        const result = await this.repository.delete(id);
        return result.affected !== 0;
    }
    async deleteMany(ids) {
        let count = 0;
        for (const id of ids) {
            const result = await this.repository.delete(id);
            count += result.affected || 0;
        }
        return count;
    }
};
exports.EmployeeRepository = EmployeeRepository;
exports.EmployeeRepository = EmployeeRepository = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [])
], EmployeeRepository);
//# sourceMappingURL=EmployeeRepository.js.map