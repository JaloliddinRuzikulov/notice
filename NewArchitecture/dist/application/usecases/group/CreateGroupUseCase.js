"use strict";
/**
 * Create Group Use Case
 * Handles creation of employee groups
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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateGroupUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const IUseCase_1 = require("../base/IUseCase");
const Group_1 = require("@/core/domain/entities/Group");
let CreateGroupUseCase = class CreateGroupUseCase {
    groupRepository;
    employeeRepository;
    constructor(groupRepository, employeeRepository) {
        this.groupRepository = groupRepository;
        this.employeeRepository = employeeRepository;
    }
    async execute(request) {
        try {
            // Validate request
            const validation = await this.validateRequest(request);
            if (!validation.isValid) {
                return (0, IUseCase_1.createErrorResult)('Validation failed', validation.errors);
            }
            // Check if group name already exists
            const existingGroup = await this.groupRepository.findByName(request.name);
            if (existingGroup) {
                return (0, IUseCase_1.createErrorResult)('Group name already exists');
            }
            // Verify all employees exist and are active
            const employeeValidation = await this.validateEmployees(request.employeeIds);
            if (!employeeValidation.isValid) {
                return (0, IUseCase_1.createErrorResult)('Employee validation failed', employeeValidation.errors);
            }
            // Create group entity  
            const group = Group_1.Group.create({
                name: request.name,
                description: request.description,
                type: Group_1.GroupType.CUSTOM, // Default type for user-created groups
                members: [], // Initialize as empty, members will be added separately
                createdBy: request.createdBy,
                isActive: true
            });
            // Save group
            const savedGroup = await this.groupRepository.save(group);
            return (0, IUseCase_1.createSuccessResult)({
                group: savedGroup
            });
        }
        catch (error) {
            return (0, IUseCase_1.createErrorResult)(`Failed to create group: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async validateRequest(request) {
        const errors = [];
        if (!request.name?.trim()) {
            errors.push('Group name is required');
        }
        if (!request.createdBy?.trim()) {
            errors.push('Creator ID is required');
        }
        if (!request.employeeIds || request.employeeIds.length === 0) {
            errors.push('At least one employee must be assigned to the group');
        }
        // Check for duplicate employee IDs
        const uniqueEmployeeIds = new Set(request.employeeIds);
        if (uniqueEmployeeIds.size !== request.employeeIds.length) {
            errors.push('Duplicate employee IDs found');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    async validateEmployees(employeeIds) {
        const errors = [];
        for (const employeeId of employeeIds) {
            const employee = await this.employeeRepository.findById(employeeId);
            if (!employee) {
                errors.push(`Employee with ID ${employeeId} not found`);
                continue;
            }
            const employeeData = employee.toObject();
            if (!employeeData.isActive) {
                errors.push(`Employee ${employeeData.firstName} ${employeeData.lastName} is not active`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
};
exports.CreateGroupUseCase = CreateGroupUseCase;
exports.CreateGroupUseCase = CreateGroupUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IGroupRepository')),
    __param(1, (0, tsyringe_1.inject)('IEmployeeRepository')),
    __metadata("design:paramtypes", [Object, Object])
], CreateGroupUseCase);
//# sourceMappingURL=CreateGroupUseCase.js.map