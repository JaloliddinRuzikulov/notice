"use strict";
/**
 * Employee Entity for TypeORM
 * Maps Employee domain entity to database table
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
exports.EmployeeEntity = void 0;
const typeorm_1 = require("typeorm");
const DepartmentEntity_1 = require("./DepartmentEntity");
const DistrictEntity_1 = require("./DistrictEntity");
let EmployeeEntity = class EmployeeEntity {
    id;
    firstName;
    lastName;
    middleName;
    phoneNumber;
    additionalPhone;
    position;
    rank;
    notes;
    photoUrl;
    isActive;
    // Relations
    department;
    departmentEntity;
    district;
    districtEntity;
    // Timestamps
    createdAt;
    updatedAt;
    // Computed column for full name
    fullName;
    // Soft delete support
    deletedAt;
    // Metadata
    metadata;
    // Validation
    validatePhoneNumber() {
        if (this.phoneNumber) {
            // Remove all non-numeric characters
            const cleaned = this.phoneNumber.replace(/\D/g, '');
            // Validate Uzbek phone format
            if (!cleaned.match(/^998[0-9]{9}$/)) {
                // Try to fix common formats
                if (cleaned.match(/^[0-9]{9}$/)) {
                    this.phoneNumber = '998' + cleaned;
                }
                else if (!cleaned.match(/^998[0-9]{9}$/)) {
                    throw new Error(`Invalid phone number format: ${this.phoneNumber}`);
                }
            }
            else {
                this.phoneNumber = cleaned;
            }
        }
        // Validate additional phone if present
        if (this.additionalPhone) {
            const cleaned = this.additionalPhone.replace(/\D/g, '');
            if (cleaned.match(/^[0-9]{9}$/)) {
                this.additionalPhone = '998' + cleaned;
            }
            else if (!cleaned.match(/^998[0-9]{9}$/)) {
                throw new Error(`Invalid additional phone format: ${this.additionalPhone}`);
            }
            else {
                this.additionalPhone = cleaned;
            }
        }
    }
};
exports.EmployeeEntity = EmployeeEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EmployeeEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], EmployeeEntity.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], EmployeeEntity.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], EmployeeEntity.prototype, "middleName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, unique: true }),
    __metadata("design:type", String)
], EmployeeEntity.prototype, "phoneNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], EmployeeEntity.prototype, "additionalPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], EmployeeEntity.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], EmployeeEntity.prototype, "rank", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], EmployeeEntity.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], EmployeeEntity.prototype, "photoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], EmployeeEntity.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], EmployeeEntity.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => DepartmentEntity_1.DepartmentEntity, { nullable: true, eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'departmentId' }),
    __metadata("design:type", DepartmentEntity_1.DepartmentEntity)
], EmployeeEntity.prototype, "departmentEntity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], EmployeeEntity.prototype, "district", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => DistrictEntity_1.DistrictEntity, { nullable: true, eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'districtId' }),
    __metadata("design:type", DistrictEntity_1.DistrictEntity)
], EmployeeEntity.prototype, "districtEntity", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EmployeeEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EmployeeEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 300,
        generatedType: 'STORED',
        asExpression: `lastName || ' ' || firstName || CASE WHEN middleName IS NOT NULL THEN ' ' || middleName ELSE '' END`,
        insert: false,
        update: false,
        nullable: true
    }),
    __metadata("design:type", String)
], EmployeeEntity.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], EmployeeEntity.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], EmployeeEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    (0, typeorm_1.BeforeUpdate)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EmployeeEntity.prototype, "validatePhoneNumber", null);
exports.EmployeeEntity = EmployeeEntity = __decorate([
    (0, typeorm_1.Entity)('employees'),
    (0, typeorm_1.Index)(['phoneNumber'], { unique: true }),
    (0, typeorm_1.Index)(['department', 'district']),
    (0, typeorm_1.Index)(['isActive']),
    (0, typeorm_1.Index)(['lastName', 'firstName'])
], EmployeeEntity);
//# sourceMappingURL=EmployeeEntity.js.map