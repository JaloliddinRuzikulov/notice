"use strict";
/**
 * Department Entity for TypeORM
 * Maps Department domain entity to database table
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
exports.DepartmentEntity = void 0;
const typeorm_1 = require("typeorm");
const EmployeeEntity_1 = require("./EmployeeEntity");
let DepartmentEntity = class DepartmentEntity {
    id;
    name;
    code;
    description;
    level;
    order;
    isActive;
    employeeCount;
    // Tree structure
    parent;
    children;
    parentId;
    // Relations
    employees;
    // Metadata
    metadata;
    // Timestamps
    createdAt;
    updatedAt;
    // Soft delete
    deletedAt;
    // Contact information
    phoneNumber;
    email;
    address;
    // Head of department
    headName;
    headPosition;
};
exports.DepartmentEntity = DepartmentEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DepartmentEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], DepartmentEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, unique: true }),
    __metadata("design:type", String)
], DepartmentEntity.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], DepartmentEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DepartmentEntity.prototype, "level", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], DepartmentEntity.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], DepartmentEntity.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DepartmentEntity.prototype, "employeeCount", void 0);
__decorate([
    (0, typeorm_1.TreeParent)(),
    __metadata("design:type", DepartmentEntity)
], DepartmentEntity.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.TreeChildren)(),
    __metadata("design:type", Array)
], DepartmentEntity.prototype, "children", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], DepartmentEntity.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => EmployeeEntity_1.EmployeeEntity, employee => employee.departmentEntity),
    __metadata("design:type", Array)
], DepartmentEntity.prototype, "employees", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], DepartmentEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DepartmentEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], DepartmentEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], DepartmentEntity.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], DepartmentEntity.prototype, "phoneNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], DepartmentEntity.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], DepartmentEntity.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", String)
], DepartmentEntity.prototype, "headName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], DepartmentEntity.prototype, "headPosition", void 0);
exports.DepartmentEntity = DepartmentEntity = __decorate([
    (0, typeorm_1.Entity)('departments'),
    (0, typeorm_1.Tree)('closure-table'),
    (0, typeorm_1.Index)(['code'], { unique: true }),
    (0, typeorm_1.Index)(['name']),
    (0, typeorm_1.Index)(['level']),
    (0, typeorm_1.Index)(['isActive'])
], DepartmentEntity);
//# sourceMappingURL=DepartmentEntity.js.map