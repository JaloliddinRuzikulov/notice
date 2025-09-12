"use strict";
/**
 * District Entity for TypeORM
 * Maps District domain entity to database table
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
exports.DistrictEntity = void 0;
const typeorm_1 = require("typeorm");
const EmployeeEntity_1 = require("./EmployeeEntity");
let DistrictEntity = class DistrictEntity {
    id;
    name;
    code;
    region;
    population;
    area; // square kilometers
    center; // District center/capital
    employeeCount;
    isActive;
    // Relations
    employees;
    // Geographic coordinates
    latitude;
    longitude;
    // Administrative info
    postalCode;
    phoneCode;
    // Statistics
    populationDensity; // people per sq km
    numberOfVillages;
    numberOfMahallas;
    // Economic indicators
    economicActivity;
    budget;
    // Leadership
    hokimName; // District governor
    hokimPhone;
    // Police department info
    policeChiefName;
    policePhone;
    policeAddress;
    // Metadata
    metadata;
    // Timestamps
    createdAt;
    updatedAt;
    // Soft delete
    deletedAt;
};
exports.DistrictEntity = DistrictEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DistrictEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], DistrictEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, unique: true }),
    __metadata("design:type", String)
], DistrictEntity.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], DistrictEntity.prototype, "region", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], DistrictEntity.prototype, "population", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], DistrictEntity.prototype, "area", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], DistrictEntity.prototype, "center", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DistrictEntity.prototype, "employeeCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], DistrictEntity.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => EmployeeEntity_1.EmployeeEntity, employee => employee.districtEntity),
    __metadata("design:type", Array)
], DistrictEntity.prototype, "employees", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], DistrictEntity.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 11, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], DistrictEntity.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], DistrictEntity.prototype, "postalCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], DistrictEntity.prototype, "phoneCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], DistrictEntity.prototype, "populationDensity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], DistrictEntity.prototype, "numberOfVillages", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], DistrictEntity.prototype, "numberOfMahallas", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], DistrictEntity.prototype, "economicActivity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], DistrictEntity.prototype, "budget", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", String)
], DistrictEntity.prototype, "hokimName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], DistrictEntity.prototype, "hokimPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", String)
], DistrictEntity.prototype, "policeChiefName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], DistrictEntity.prototype, "policePhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], DistrictEntity.prototype, "policeAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], DistrictEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DistrictEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], DistrictEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], DistrictEntity.prototype, "deletedAt", void 0);
exports.DistrictEntity = DistrictEntity = __decorate([
    (0, typeorm_1.Entity)('districts'),
    (0, typeorm_1.Index)(['code'], { unique: true }),
    (0, typeorm_1.Index)(['name']),
    (0, typeorm_1.Index)(['region']),
    (0, typeorm_1.Index)(['isActive'])
], DistrictEntity);
//# sourceMappingURL=DistrictEntity.js.map