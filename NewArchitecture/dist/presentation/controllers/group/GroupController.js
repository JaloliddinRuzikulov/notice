"use strict";
/**
 * Group Controller
 * Handles HTTP requests for employee group management
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
exports.GroupController = void 0;
const tsyringe_1 = require("tsyringe");
const BaseController_1 = require("../base/BaseController");
const CreateGroupUseCase_1 = require("@/application/usecases/group/CreateGroupUseCase");
const UpdateGroupUseCase_1 = require("@/application/usecases/group/UpdateGroupUseCase");
const GetGroupListUseCase_1 = require("@/application/usecases/group/GetGroupListUseCase");
const DeleteGroupUseCase_1 = require("@/application/usecases/group/DeleteGroupUseCase");
const GroupMapper_1 = require("@/application/mappers/group/GroupMapper");
let GroupController = class GroupController extends BaseController_1.BaseController {
    createGroupUseCase;
    updateGroupUseCase;
    getGroupListUseCase;
    deleteGroupUseCase;
    groupMapper;
    constructor(createGroupUseCase, updateGroupUseCase, getGroupListUseCase, deleteGroupUseCase, groupMapper) {
        super();
        this.createGroupUseCase = createGroupUseCase;
        this.updateGroupUseCase = updateGroupUseCase;
        this.getGroupListUseCase = getGroupListUseCase;
        this.deleteGroupUseCase = deleteGroupUseCase;
        this.groupMapper = groupMapper;
    }
    /**
     * Create new group
     * POST /api/groups
     */
    async createGroup(req, res) {
        try {
            const user = this.getUserFromRequest(req);
            if (!user.id) {
                return this.unauthorized(res, 'User not authenticated');
            }
            const validation = this.validateRequestBody(req, ['name', 'employeeIds']);
            if (!validation.isValid) {
                return this.badRequest(res, 'Validation failed', validation.errors);
            }
            // Validate employeeIds
            if (!Array.isArray(req.body.employeeIds) || req.body.employeeIds.length === 0) {
                return this.badRequest(res, 'At least one employee must be assigned to the group');
            }
            const createDTO = this.sanitizeInput({
                name: req.body.name,
                description: req.body.description,
                employeeIds: req.body.employeeIds
            });
            // Validate employee IDs using mapper
            const employeeValidation = this.groupMapper.validateEmployeeIds(createDTO.employeeIds);
            if (!employeeValidation.isValid) {
                return this.badRequest(res, 'Employee validation failed', employeeValidation.errors);
            }
            const result = await this.createGroupUseCase.execute({
                ...createDTO,
                createdBy: user.id
            });
            if (result.success && result.data) {
                const groupDTO = this.groupMapper.toDTO(result.data.group);
                return this.created(res, groupDTO, 'Group created successfully');
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error creating group:', error);
            return this.internalError(res, 'Failed to create group');
        }
    }
    /**
     * Get group list with search and pagination
     * GET /api/groups
     */
    async getGroups(req, res) {
        try {
            const pagination = this.getPaginationFromQuery(req);
            const includeEmployees = req.query.includeEmployees === 'true';
            const search = {
                name: req.query.name,
                createdBy: req.query.createdBy,
                isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
                hasEmployee: req.query.hasEmployee
            };
            // Remove undefined values
            Object.keys(search).forEach(key => search[key] === undefined && delete search[key]);
            const result = await this.getGroupListUseCase.execute({
                search: Object.keys(search).length > 0 ? search : undefined,
                pagination,
                includeEmployees
            });
            if (result.success && result.data) {
                const groupDTOs = result.data.groups.map(group => includeEmployees && 'employees' in group
                    ? group // Already enhanced with employees
                    : this.groupMapper.toDTO(group));
                if (result.data.pagination) {
                    return this.paginated(res, groupDTOs, result.data.pagination);
                }
                else {
                    return this.success(res, groupDTOs);
                }
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error getting groups:', error);
            return this.internalError(res, 'Failed to retrieve groups');
        }
    }
    /**
     * Get group by ID
     * GET /api/groups/:id
     */
    async getGroupById(req, res) {
        try {
            const { id } = req.params;
            const includeEmployees = req.query.includeEmployees === 'true';
            if (!id) {
                return this.badRequest(res, 'Group ID is required');
            }
            // This would use a GetGroupByIdUseCase (not implemented in this example)
            // For now, we'll use the list use case with a workaround
            const result = await this.getGroupListUseCase.execute({
                includeEmployees
            });
            if (result.success && result.data && result.data.groups.length > 0) {
                const group = result.data.groups.find(g => g.toObject().id === id);
                if (group) {
                    const groupDTO = includeEmployees && 'employees' in group
                        ? group
                        : this.groupMapper.toDTO(group);
                    return this.success(res, groupDTO);
                }
            }
            return this.notFound(res, 'Group not found');
        }
        catch (error) {
            console.error('Error getting group by ID:', error);
            return this.internalError(res, 'Failed to retrieve group');
        }
    }
    /**
     * Update group
     * PUT /api/groups/:id
     */
    async updateGroup(req, res) {
        try {
            const user = this.getUserFromRequest(req);
            const { id } = req.params;
            if (!user.id) {
                return this.unauthorized(res, 'User not authenticated');
            }
            if (!id) {
                return this.badRequest(res, 'Group ID is required');
            }
            const updateDTO = this.sanitizeInput({
                name: req.body.name,
                description: req.body.description,
                employeeIds: req.body.employeeIds,
                isActive: req.body.isActive
            });
            // Remove undefined values
            Object.keys(updateDTO).forEach(key => updateDTO[key] === undefined && delete updateDTO[key]);
            // Validate employee IDs if they are being updated
            if (updateDTO.employeeIds) {
                const employeeValidation = this.groupMapper.validateEmployeeIds(updateDTO.employeeIds);
                if (!employeeValidation.isValid) {
                    return this.badRequest(res, 'Employee validation failed', employeeValidation.errors);
                }
            }
            const result = await this.updateGroupUseCase.execute({
                groupId: id,
                updatedBy: user.id,
                ...updateDTO
            });
            if (result.success && result.data) {
                const groupDTO = this.groupMapper.toDTO(result.data.group);
                return this.success(res, groupDTO, 'Group updated successfully');
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error updating group:', error);
            return this.internalError(res, 'Failed to update group');
        }
    }
    /**
     * Delete group (soft delete)
     * DELETE /api/groups/:id
     */
    async deleteGroup(req, res) {
        try {
            const user = this.getUserFromRequest(req);
            const { id } = req.params;
            const force = req.query.force === 'true';
            if (!user.id) {
                return this.unauthorized(res, 'User not authenticated');
            }
            if (!id) {
                return this.badRequest(res, 'Group ID is required');
            }
            const result = await this.deleteGroupUseCase.execute({
                groupId: id,
                deletedBy: user.id,
                force
            });
            if (result.success) {
                return this.noContent(res, 'Group deleted successfully');
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error deleting group:', error);
            return this.internalError(res, 'Failed to delete group');
        }
    }
    /**
     * Add employees to group
     * POST /api/groups/:id/employees
     */
    async addEmployeesToGroup(req, res) {
        try {
            const user = this.getUserFromRequest(req);
            const { id } = req.params;
            if (!user.id) {
                return this.unauthorized(res, 'User not authenticated');
            }
            if (!id) {
                return this.badRequest(res, 'Group ID is required');
            }
            const validation = this.validateRequestBody(req, ['employeeIds']);
            if (!validation.isValid) {
                return this.badRequest(res, 'Validation failed', validation.errors);
            }
            if (!Array.isArray(req.body.employeeIds) || req.body.employeeIds.length === 0) {
                return this.badRequest(res, 'At least one employee ID must be provided');
            }
            // This would require a separate use case for adding employees to a group
            // For now, we'll use the update use case to simulate this functionality
            return res.status(501).json({
                success: false,
                error: 'Add employees to group not implemented yet'
            });
        }
        catch (error) {
            console.error('Error adding employees to group:', error);
            return this.internalError(res, 'Failed to add employees to group');
        }
    }
    /**
     * Remove employees from group
     * DELETE /api/groups/:id/employees
     */
    async removeEmployeesFromGroup(req, res) {
        try {
            const user = this.getUserFromRequest(req);
            const { id } = req.params;
            if (!user.id) {
                return this.unauthorized(res, 'User not authenticated');
            }
            if (!id) {
                return this.badRequest(res, 'Group ID is required');
            }
            const validation = this.validateRequestBody(req, ['employeeIds']);
            if (!validation.isValid) {
                return this.badRequest(res, 'Validation failed', validation.errors);
            }
            if (!Array.isArray(req.body.employeeIds) || req.body.employeeIds.length === 0) {
                return this.badRequest(res, 'At least one employee ID must be provided');
            }
            // This would require a separate use case for removing employees from a group
            // For now, we'll use the update use case to simulate this functionality
            return res.status(501).json({
                success: false,
                error: 'Remove employees from group not implemented yet'
            });
        }
        catch (error) {
            console.error('Error removing employees from group:', error);
            return this.internalError(res, 'Failed to remove employees from group');
        }
    }
    /**
     * Get group statistics
     * GET /api/groups/statistics
     */
    async getGroupStatistics(req, res) {
        try {
            const result = await this.getGroupListUseCase.execute({});
            if (result.success && result.data) {
                const statisticsDTO = this.groupMapper.toStatisticsDTO(result.data.groups);
                return this.success(res, statisticsDTO);
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error getting group statistics:', error);
            return this.internalError(res, 'Failed to retrieve group statistics');
        }
    }
};
exports.GroupController = GroupController;
exports.GroupController = GroupController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(CreateGroupUseCase_1.CreateGroupUseCase)),
    __param(1, (0, tsyringe_1.inject)(UpdateGroupUseCase_1.UpdateGroupUseCase)),
    __param(2, (0, tsyringe_1.inject)(GetGroupListUseCase_1.GetGroupListUseCase)),
    __param(3, (0, tsyringe_1.inject)(DeleteGroupUseCase_1.DeleteGroupUseCase)),
    __param(4, (0, tsyringe_1.inject)(GroupMapper_1.GroupMapper)),
    __metadata("design:paramtypes", [CreateGroupUseCase_1.CreateGroupUseCase,
        UpdateGroupUseCase_1.UpdateGroupUseCase,
        GetGroupListUseCase_1.GetGroupListUseCase,
        DeleteGroupUseCase_1.DeleteGroupUseCase,
        GroupMapper_1.GroupMapper])
], GroupController);
//# sourceMappingURL=GroupController.js.map