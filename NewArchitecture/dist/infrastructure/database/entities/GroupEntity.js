"use strict";
/**
 * Group Entity for TypeORM
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
exports.GroupEntity = exports.GroupTypeDB = void 0;
const typeorm_1 = require("typeorm");
var GroupTypeDB;
(function (GroupTypeDB) {
    GroupTypeDB["STATIC"] = "static";
    GroupTypeDB["DYNAMIC"] = "dynamic";
    GroupTypeDB["DEPARTMENT"] = "department";
    GroupTypeDB["DISTRICT"] = "district";
    GroupTypeDB["CUSTOM"] = "custom";
})(GroupTypeDB || (exports.GroupTypeDB = GroupTypeDB = {}));
let GroupEntity = class GroupEntity {
    id;
    name;
    description;
    type;
    members;
    departmentIds;
    districtIds;
    createdBy;
    isActive;
    metadata;
    createdAt;
    updatedAt;
};
exports.GroupEntity = GroupEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GroupEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], GroupEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], GroupEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: GroupTypeDB,
        default: GroupTypeDB.STATIC
    }),
    __metadata("design:type", String)
], GroupEntity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json' }),
    __metadata("design:type", Array)
], GroupEntity.prototype, "members", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], GroupEntity.prototype, "departmentIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], GroupEntity.prototype, "districtIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], GroupEntity.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], GroupEntity.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], GroupEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], GroupEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], GroupEntity.prototype, "updatedAt", void 0);
exports.GroupEntity = GroupEntity = __decorate([
    (0, typeorm_1.Entity)('groups'),
    (0, typeorm_1.Index)(['name']),
    (0, typeorm_1.Index)(['type']),
    (0, typeorm_1.Index)(['createdBy'])
], GroupEntity);
//# sourceMappingURL=GroupEntity.js.map