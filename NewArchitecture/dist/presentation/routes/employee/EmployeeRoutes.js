"use strict";
/**
 * Employee Routes
 * Defines routes for employee management endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeRoutes = void 0;
const express_validator_1 = require("express-validator");
const tsyringe_1 = require("tsyringe");
const BaseRouter_1 = require("../base/BaseRouter");
const EmployeeController_1 = require("@/presentation/controllers/employee/EmployeeController");
const ErrorHandlerMiddleware_1 = require("@/presentation/middlewares/ErrorHandlerMiddleware");
class EmployeeRoutes extends BaseRouter_1.BaseRouter {
    employeeController;
    constructor() {
        super();
        // Try to resolve controller, if fails use a mock
        try {
            this.employeeController = tsyringe_1.container.resolve(EmployeeController_1.EmployeeController);
        }
        catch (error) {
            // In test environment, controller might not be registered
            console.warn('Failed to resolve EmployeeController from container');
            // Create a dummy controller for testing
            this.employeeController = {};
        }
    }
    setupRoutes() {
        // Check if controller is properly initialized
        if (!this.employeeController || !this.employeeController.getEmployees) {
            console.warn('EmployeeController not properly initialized, skipping route setup');
            return;
        }
        /**
         * @route GET /api/employees
         * @desc Get list of employees with search and pagination
         * @access Private
         */
        this.router.get('/', ...this.apiEndpoint(), this.validatePagination(), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.employeeController.getEmployees.bind(this.employeeController)));
        /**
         * @route GET /api/employees/:id
         * @desc Get employee by ID
         * @access Private
         */
        this.router.get('/:id', ...this.apiEndpoint(), this.validateUUID('id'), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.employeeController.getEmployeeById.bind(this.employeeController)));
        /**
         * @route POST /api/employees
         * @desc Create new employee
         * @access Private - requires employee:create permission
         */
        this.router.post('/', ...this.apiEndpoint(), this.requirePermissions(['employee:create', 'employee:manage']), this.validate([
            (0, express_validator_1.body)('firstName')
                .trim()
                .isLength({ min: 2, max: 50 })
                .withMessage('First name must be between 2 and 50 characters'),
            (0, express_validator_1.body)('lastName')
                .trim()
                .isLength({ min: 2, max: 50 })
                .withMessage('Last name must be between 2 and 50 characters'),
            (0, express_validator_1.body)('middleName')
                .optional()
                .trim()
                .isLength({ max: 50 })
                .withMessage('Middle name must not exceed 50 characters'),
            (0, express_validator_1.body)('phoneNumber')
                .matches(/^(\+998|998)?[0-9]{9}$/)
                .withMessage('Invalid phone number format (Uzbekistan format required)'),
            (0, express_validator_1.body)('additionalPhone')
                .optional()
                .matches(/^(\+998|998)?[0-9]{9}$/)
                .withMessage('Invalid additional phone number format'),
            (0, express_validator_1.body)('department')
                .trim()
                .notEmpty()
                .withMessage('Department is required'),
            (0, express_validator_1.body)('district')
                .trim()
                .notEmpty()
                .withMessage('District is required'),
            (0, express_validator_1.body)('position')
                .optional()
                .trim()
                .isLength({ max: 100 })
                .withMessage('Position must not exceed 100 characters'),
            (0, express_validator_1.body)('rank')
                .optional()
                .trim()
                .isLength({ max: 50 })
                .withMessage('Rank must not exceed 50 characters'),
            (0, express_validator_1.body)('notes')
                .optional()
                .trim()
                .isLength({ max: 500 })
                .withMessage('Notes must not exceed 500 characters'),
            (0, express_validator_1.body)('photoUrl')
                .optional()
                .isURL()
                .withMessage('Photo URL must be a valid URL')
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.employeeController.createEmployee.bind(this.employeeController)));
        /**
         * @route PUT /api/employees/:id
         * @desc Update employee
         * @access Private - requires employee:update permission
         */
        this.router.put('/:id', ...this.apiEndpoint(), this.requirePermissions(['employee:update', 'employee:manage']), this.validateUUID('id'), this.validate([
            (0, express_validator_1.body)('firstName')
                .optional()
                .trim()
                .isLength({ min: 2, max: 50 })
                .withMessage('First name must be between 2 and 50 characters'),
            (0, express_validator_1.body)('lastName')
                .optional()
                .trim()
                .isLength({ min: 2, max: 50 })
                .withMessage('Last name must be between 2 and 50 characters'),
            (0, express_validator_1.body)('middleName')
                .optional()
                .trim()
                .isLength({ max: 50 })
                .withMessage('Middle name must not exceed 50 characters'),
            (0, express_validator_1.body)('phoneNumber')
                .optional()
                .matches(/^(\+998|998)?[0-9]{9}$/)
                .withMessage('Invalid phone number format'),
            (0, express_validator_1.body)('additionalPhone')
                .optional()
                .matches(/^(\+998|998)?[0-9]{9}$/)
                .withMessage('Invalid additional phone number format'),
            (0, express_validator_1.body)('department')
                .optional()
                .trim()
                .notEmpty()
                .withMessage('Department cannot be empty'),
            (0, express_validator_1.body)('district')
                .optional()
                .trim()
                .notEmpty()
                .withMessage('District cannot be empty'),
            (0, express_validator_1.body)('position')
                .optional()
                .trim()
                .isLength({ max: 100 })
                .withMessage('Position must not exceed 100 characters'),
            (0, express_validator_1.body)('rank')
                .optional()
                .trim()
                .isLength({ max: 50 })
                .withMessage('Rank must not exceed 50 characters'),
            (0, express_validator_1.body)('notes')
                .optional()
                .trim()
                .isLength({ max: 500 })
                .withMessage('Notes must not exceed 500 characters'),
            (0, express_validator_1.body)('photoUrl')
                .optional()
                .isURL()
                .withMessage('Photo URL must be a valid URL'),
            (0, express_validator_1.body)('isActive')
                .optional()
                .isBoolean()
                .withMessage('isActive must be a boolean')
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.employeeController.updateEmployee.bind(this.employeeController)));
        /**
         * @route DELETE /api/employees/:id
         * @desc Delete (deactivate) employee
         * @access Private - requires employee:delete permission or admin role
         */
        this.router.delete('/:id', ...this.apiEndpoint(), this.requirePermissions(['employee:delete', 'employee:manage']), this.validateUUID('id'), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.employeeController.deleteEmployee.bind(this.employeeController)));
        /**
         * @route GET /api/employees/department/:department
         * @desc Get employees by department
         * @access Private
         */
        this.router.get('/department/:department', ...this.apiEndpoint(), this.validatePagination(), this.validate([
            (0, express_validator_1.param)('department')
                .trim()
                .notEmpty()
                .withMessage('Department parameter is required')
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.employeeController.getEmployeesByDepartment.bind(this.employeeController)));
        /**
         * @route GET /api/employees/district/:district
         * @desc Get employees by district
         * @access Private
         */
        this.router.get('/district/:district', ...this.apiEndpoint(), this.validatePagination(), this.validate([
            (0, express_validator_1.param)('district')
                .trim()
                .notEmpty()
                .withMessage('District parameter is required')
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.employeeController.getEmployeesByDistrict.bind(this.employeeController)));
        /**
         * @route GET /api/employees/search
         * @desc Search employees with advanced filters
         * @access Private
         */
        this.router.get('/search', ...this.apiEndpoint(), this.validatePagination(), this.validate([
            (0, express_validator_1.query)('name')
                .optional()
                .trim()
                .isLength({ min: 2 })
                .withMessage('Name search must be at least 2 characters'),
            (0, express_validator_1.query)('phoneNumber')
                .optional()
                .matches(/^(\+998|998)?[0-9]{9}$/)
                .withMessage('Invalid phone number format'),
            (0, express_validator_1.query)('isActive')
                .optional()
                .isBoolean()
                .withMessage('isActive must be true or false')
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.employeeController.getEmployees.bind(this.employeeController)));
    }
}
exports.EmployeeRoutes = EmployeeRoutes;
//# sourceMappingURL=EmployeeRoutes.js.map