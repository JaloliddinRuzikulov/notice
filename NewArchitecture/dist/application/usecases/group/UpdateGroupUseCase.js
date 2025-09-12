"use strict";
/**
 * Update Group Use Case
 * Handles updating existing group information and membership
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
exports.UpdateGroupUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const IUseCase_1 = require("../base/IUseCase");
let UpdateGroupUseCase = class UpdateGroupUseCase {
    groupRepository;
    employeeRepository;
    constructor(groupRepository, employeeRepository) {
        this.groupRepository = groupRepository;
        this.employeeRepository = employeeRepository;
    }
    async execute(request) {
        try {
            // Validate request
            const validation = this.validateRequest(request);
            if (!validation.isValid) {
                return (0, IUseCase_1.createErrorResult)('Validation failed', validation.errors);
            }
            // Check if group exists
            const existingGroup = await this.groupRepository.findById(request.groupId);
            if (!existingGroup) {
                return (0, IUseCase_1.createErrorResult)('Group not found');
            }
            // Check if name is being changed and if new name already exists
            if (request.name && request.name !== existingGroup.toObject().name) {
                const nameExists = await this.groupRepository.findByName(request.name);
                if (nameExists) {
                    return (0, IUseCase_1.createErrorResult)('Group name already exists');
                }
            }
            // Validate employees if being updated
            if (request.employeeIds) {
                if (request.employeeIds.length === 0) {
                    return (0, IUseCase_1.createErrorResult)('At least one employee must be assigned to the group');
                }
                const employeeValidation = await this.validateEmployees(request.employeeIds);
                if (!employeeValidation.isValid) {
                    return (0, IUseCase_1.createErrorResult)('Employee validation failed', employeeValidation.errors);
                }
            }
            // Create update data
            const updateData = {
                ...(request.name && { name: request.name.trim() }),
                ...(request.description !== undefined && { description: request.description }),
                ...(request.employeeIds && { employeeIds: request.employeeIds }),
                ...(request.isActive !== undefined && { isActive: request.isActive })
            };
            // Update group
            const updatedGroup = await this.groupRepository.update(request.groupId, updateData);
            if (!updatedGroup) {
                return (0, IUseCase_1.createErrorResult)('Failed to update group');
            }
            return (0, IUseCase_1.createSuccessResult)({
                group: updatedGroup
            });
        }
        catch (error) {
            return (0, IUseCase_1.createErrorResult)(`Failed to update group: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    validateRequest(request) {
        const errors = [];
        if (!request.groupId?.trim()) {
            errors.push('Group ID is required');
        }
        if (!request.updatedBy?.trim()) {
            errors.push('Updater ID is required');
        }
        // Check if at least one field is being updated
        const hasUpdates = request.name ||
            request.description !== undefined ||
            request.employeeIds ||
            request.isActive !== undefined;
        if (!hasUpdates) {
            errors.push('At least one field must be updated');
        }
        // Check for duplicate employee IDs if provided
        if (request.employeeIds) {
            const uniqueEmployeeIds = new Set(request.employeeIds);
            if (uniqueEmployeeIds.size !== request.employeeIds.length) {
                errors.push('Duplicate employee IDs found');
            }
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
exports.UpdateGroupUseCase = UpdateGroupUseCase;
exports.UpdateGroupUseCase = UpdateGroupUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IGroupRepository')),
    __param(1, (0, tsyringe_1.inject)('IEmployeeRepository')),
    __metadata("design:paramtypes", [Object, Object])
], UpdateGroupUseCase);
//# sourceMappingURL=UpdateGroupUseCase.js.map