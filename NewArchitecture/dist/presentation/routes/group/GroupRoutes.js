"use strict";
/**
 * Group Routes
 * Defines routes for employee group management endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupRoutes = void 0;
const express_validator_1 = require("express-validator");
const tsyringe_1 = require("tsyringe");
const BaseRouter_1 = require("../base/BaseRouter");
const GroupController_1 = require("@/presentation/controllers/group/GroupController");
const ErrorHandlerMiddleware_1 = require("@/presentation/middlewares/ErrorHandlerMiddleware");
class GroupRoutes extends BaseRouter_1.BaseRouter {
    groupController;
    constructor() {
        super();
        this.groupController = tsyringe_1.container.resolve(GroupController_1.GroupController);
    }
    setupRoutes() {
        /**
         * @route GET /api/groups
         * @desc Get list of groups with search and pagination
         * @access Private
         */
        this.router.get('/', ...this.apiEndpoint(), this.validatePagination(), this.validate([
            (0, express_validator_1.query)('name')
                .optional()
                .trim()
                .isLength({ min: 2 })
                .withMessage('Name search must be at least 2 characters'),
            (0, express_validator_1.query)('isActive')
                .optional()
                .isBoolean()
                .withMessage('isActive must be true or false'),
            (0, express_validator_1.query)('includeEmployees')
                .optional()
                .isBoolean()
                .withMessage('includeEmployees must be true or false'),
            (0, express_validator_1.query)('hasEmployee')
                .optional()
                .isUUID()
                .withMessage('hasEmployee must be a valid UUID')
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.groupController.getGroups.bind(this.groupController)));
        /**
         * @route GET /api/groups/:id
         * @desc Get group by ID
         * @access Private
         */
        this.router.get('/:id', ...this.apiEndpoint(), this.validateUUID('id'), this.validate([
            (0, express_validator_1.query)('includeEmployees')
                .optional()
                .isBoolean()
                .withMessage('includeEmployees must be true or false')
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.groupController.getGroupById.bind(this.groupController)));
        /**
         * @route POST /api/groups
         * @desc Create new group
         * @access Private - requires group:create permission
         */
        this.router.post('/', ...this.apiEndpoint(), this.requirePermissions(['group:create', 'group:manage']), this.validate([
            (0, express_validator_1.body)('name')
                .trim()
                .isLength({ min: 3, max: 100 })
                .withMessage('Group name must be between 3 and 100 characters')
                .matches(/^[a-zA-Z0-9\s\-_]+$/)
                .withMessage('Group name can only contain letters, numbers, spaces, hyphens and underscores'),
            (0, express_validator_1.body)('description')
                .optional()
                .trim()
                .isLength({ max: 500 })
                .withMessage('Description must not exceed 500 characters'),
            (0, express_validator_1.body)('employeeIds')
                .isArray({ min: 1 })
                .withMessage('At least one employee must be assigned to the group')
                .custom((arr) => {
                if (!arr.every((id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))) {
                    throw new Error('All employee IDs must be valid UUIDs');
                }
                // Check for duplicates
                const uniqueIds = new Set(arr);
                if (uniqueIds.size !== arr.length) {
                    throw new Error('Duplicate employee IDs are not allowed');
                }
                return true;
            })
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.groupController.createGroup.bind(this.groupController)));
        /**
         * @route PUT /api/groups/:id
         * @desc Update group
         * @access Private - requires group:update permission
         */
        this.router.put('/:id', ...this.apiEndpoint(), this.requirePermissions(['group:update', 'group:manage']), this.validateUUID('id'), this.validate([
            (0, express_validator_1.body)('name')
                .optional()
                .trim()
                .isLength({ min: 3, max: 100 })
                .withMessage('Group name must be between 3 and 100 characters')
                .matches(/^[a-zA-Z0-9\s\-_]+$/)
                .withMessage('Group name can only contain letters, numbers, spaces, hyphens and underscores'),
            (0, express_validator_1.body)('description')
                .optional()
                .trim()
                .isLength({ max: 500 })
                .withMessage('Description must not exceed 500 characters'),
            (0, express_validator_1.body)('employeeIds')
                .optional()
                .isArray({ min: 1 })
                .withMessage('At least one employee must be assigned to the group')
                .custom((arr) => {
                if (arr && !arr.every((id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))) {
                    throw new Error('All employee IDs must be valid UUIDs');
                }
                // Check for duplicates
                if (arr) {
                    const uniqueIds = new Set(arr);
                    if (uniqueIds.size !== arr.length) {
                        throw new Error('Duplicate employee IDs are not allowed');
                    }
                }
                return true;
            }),
            (0, express_validator_1.body)('isActive')
                .optional()
                .isBoolean()
                .withMessage('isActive must be a boolean')
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.groupController.updateGroup.bind(this.groupController)));
        /**
         * @route DELETE /api/groups/:id
         * @desc Delete (deactivate) group
         * @access Private - requires group:delete permission
         */
        this.router.delete('/:id', ...this.apiEndpoint(), this.requirePermissions(['group:delete', 'group:manage']), this.validateUUID('id'), this.validate([
            (0, express_validator_1.query)('force')
                .optional()
                .isBoolean()
                .withMessage('force must be true or false')
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.groupController.deleteGroup.bind(this.groupController)));
        /**
         * @route POST /api/groups/:id/employees
         * @desc Add employees to group
         * @access Private - requires group:update permission
         */
        this.router.post('/:id/employees', ...this.apiEndpoint(), this.requirePermissions(['group:update', 'group:manage']), this.validateUUID('id'), this.validate([
            (0, express_validator_1.body)('employeeIds')
                .isArray({ min: 1 })
                .withMessage('At least one employee ID must be provided')
                .custom((arr) => {
                if (!arr.every((id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))) {
                    throw new Error('All employee IDs must be valid UUIDs');
                }
                return true;
            })
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.groupController.addEmployeesToGroup.bind(this.groupController)));
        /**
         * @route DELETE /api/groups/:id/employees
         * @desc Remove employees from group
         * @access Private - requires group:update permission
         */
        this.router.delete('/:id/employees', ...this.apiEndpoint(), this.requirePermissions(['group:update', 'group:manage']), this.validateUUID('id'), this.validate([
            (0, express_validator_1.body)('employeeIds')
                .isArray({ min: 1 })
                .withMessage('At least one employee ID must be provided')
                .custom((arr) => {
                if (!arr.every((id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))) {
                    throw new Error('All employee IDs must be valid UUIDs');
                }
                return true;
            })
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.groupController.removeEmployeesFromGroup.bind(this.groupController)));
        /**
         * @route GET /api/groups/statistics
         * @desc Get group statistics
         * @access Private - requires group:view permission
         */
        this.router.get('/statistics', ...this.apiEndpoint(), this.requirePermissions(['group:view', 'group:manage']), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.groupController.getGroupStatistics.bind(this.groupController)));
        /**
         * @route GET /api/groups/search
         * @desc Search groups with advanced filters
         * @access Private
         */
        this.router.get('/search', ...this.apiEndpoint(), this.validatePagination(), this.validate([
            (0, express_validator_1.query)('name')
                .optional()
                .trim()
                .isLength({ min: 2 })
                .withMessage('Name search must be at least 2 characters'),
            (0, express_validator_1.query)('createdBy')
                .optional()
                .isUUID()
                .withMessage('CreatedBy must be a valid UUID'),
            (0, express_validator_1.query)('isActive')
                .optional()
                .isBoolean()
                .withMessage('isActive must be true or false'),
            (0, express_validator_1.query)('hasEmployee')
                .optional()
                .isUUID()
                .withMessage('hasEmployee must be a valid UUID'),
            (0, express_validator_1.query)('includeEmployees')
                .optional()
                .isBoolean()
                .withMessage('includeEmployees must be true or false')
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.groupController.getGroups.bind(this.groupController)));
        /**
         * @route GET /api/groups/employee/:employeeId
         * @desc Get groups that contain specific employee
         * @access Private
         */
        this.router.get('/employee/:employeeId', ...this.apiEndpoint(), this.validateUUID('employeeId'), this.validatePagination(), this.validate([
            (0, express_validator_1.param)('employeeId')
                .isUUID()
                .withMessage('Employee ID must be a valid UUID')
        ]), (req, res, next) => {
            // Add hasEmployee query parameter based on route parameter
            req.query.hasEmployee = req.params.employeeId;
            next();
        }, ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.groupController.getGroups.bind(this.groupController)));
    }
}
exports.GroupRoutes = GroupRoutes;
//# sourceMappingURL=GroupRoutes.js.map