/**
 * Employee Routes
 * Defines routes for employee management endpoints
 */

import { body, param, query } from 'express-validator';
import { container } from 'tsyringe';
import { BaseRouter } from '../base/BaseRouter';
import { EmployeeController } from '@/presentation/controllers/employee/EmployeeController';
import { ErrorHandlerMiddleware } from '@/presentation/middlewares/ErrorHandlerMiddleware';

export class EmployeeRoutes extends BaseRouter {
  private employeeController: EmployeeController;

  constructor() {
    super();
    // Try to resolve controller, if fails use a mock
    try {
      this.employeeController = container.resolve(EmployeeController);
    } catch (error) {
      // In test environment, controller might not be registered
      console.warn('Failed to resolve EmployeeController from container');
      // Create a dummy controller for testing
      this.employeeController = {} as EmployeeController;
    }
  }

  protected setupRoutes(): void {
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
    this.router.get(
      '/',
      ...this.apiEndpoint(),
      this.validatePagination(),
      ErrorHandlerMiddleware.asyncHandler(this.employeeController.getEmployees.bind(this.employeeController))
    );

    /**
     * @route GET /api/employees/:id
     * @desc Get employee by ID
     * @access Private
     */
    this.router.get(
      '/:id',
      ...this.apiEndpoint(),
      this.validateUUID('id'),
      ErrorHandlerMiddleware.asyncHandler(this.employeeController.getEmployeeById.bind(this.employeeController))
    );

    /**
     * @route POST /api/employees
     * @desc Create new employee
     * @access Private - requires employee:create permission
     */
    this.router.post(
      '/',
      ...this.apiEndpoint(),
      this.requirePermissions(['employee:create', 'employee:manage']),
      this.validate([
        body('firstName')
          .trim()
          .isLength({ min: 2, max: 50 })
          .withMessage('First name must be between 2 and 50 characters'),
        body('lastName')
          .trim()
          .isLength({ min: 2, max: 50 })
          .withMessage('Last name must be between 2 and 50 characters'),
        body('middleName')
          .optional()
          .trim()
          .isLength({ max: 50 })
          .withMessage('Middle name must not exceed 50 characters'),
        body('phoneNumber')
          .matches(/^(\+998|998)?[0-9]{9}$/)
          .withMessage('Invalid phone number format (Uzbekistan format required)'),
        body('additionalPhone')
          .optional()
          .matches(/^(\+998|998)?[0-9]{9}$/)
          .withMessage('Invalid additional phone number format'),
        body('department')
          .trim()
          .notEmpty()
          .withMessage('Department is required'),
        body('district')
          .trim()
          .notEmpty()
          .withMessage('District is required'),
        body('position')
          .optional()
          .trim()
          .isLength({ max: 100 })
          .withMessage('Position must not exceed 100 characters'),
        body('rank')
          .optional()
          .trim()
          .isLength({ max: 50 })
          .withMessage('Rank must not exceed 50 characters'),
        body('notes')
          .optional()
          .trim()
          .isLength({ max: 500 })
          .withMessage('Notes must not exceed 500 characters'),
        body('photoUrl')
          .optional()
          .isURL()
          .withMessage('Photo URL must be a valid URL')
      ]),
      ErrorHandlerMiddleware.asyncHandler(this.employeeController.createEmployee.bind(this.employeeController))
    );

    /**
     * @route PUT /api/employees/:id
     * @desc Update employee
     * @access Private - requires employee:update permission
     */
    this.router.put(
      '/:id',
      ...this.apiEndpoint(),
      this.requirePermissions(['employee:update', 'employee:manage']),
      this.validateUUID('id'),
      this.validate([
        body('firstName')
          .optional()
          .trim()
          .isLength({ min: 2, max: 50 })
          .withMessage('First name must be between 2 and 50 characters'),
        body('lastName')
          .optional()
          .trim()
          .isLength({ min: 2, max: 50 })
          .withMessage('Last name must be between 2 and 50 characters'),
        body('middleName')
          .optional()
          .trim()
          .isLength({ max: 50 })
          .withMessage('Middle name must not exceed 50 characters'),
        body('phoneNumber')
          .optional()
          .matches(/^(\+998|998)?[0-9]{9}$/)
          .withMessage('Invalid phone number format'),
        body('additionalPhone')
          .optional()
          .matches(/^(\+998|998)?[0-9]{9}$/)
          .withMessage('Invalid additional phone number format'),
        body('department')
          .optional()
          .trim()
          .notEmpty()
          .withMessage('Department cannot be empty'),
        body('district')
          .optional()
          .trim()
          .notEmpty()
          .withMessage('District cannot be empty'),
        body('position')
          .optional()
          .trim()
          .isLength({ max: 100 })
          .withMessage('Position must not exceed 100 characters'),
        body('rank')
          .optional()
          .trim()
          .isLength({ max: 50 })
          .withMessage('Rank must not exceed 50 characters'),
        body('notes')
          .optional()
          .trim()
          .isLength({ max: 500 })
          .withMessage('Notes must not exceed 500 characters'),
        body('photoUrl')
          .optional()
          .isURL()
          .withMessage('Photo URL must be a valid URL'),
        body('isActive')
          .optional()
          .isBoolean()
          .withMessage('isActive must be a boolean')
      ]),
      ErrorHandlerMiddleware.asyncHandler(this.employeeController.updateEmployee.bind(this.employeeController))
    );

    /**
     * @route DELETE /api/employees/:id
     * @desc Delete (deactivate) employee
     * @access Private - requires employee:delete permission or admin role
     */
    this.router.delete(
      '/:id',
      ...this.apiEndpoint(),
      this.requirePermissions(['employee:delete', 'employee:manage']),
      this.validateUUID('id'),
      ErrorHandlerMiddleware.asyncHandler(this.employeeController.deleteEmployee.bind(this.employeeController))
    );

    /**
     * @route GET /api/employees/department/:department
     * @desc Get employees by department
     * @access Private
     */
    this.router.get(
      '/department/:department',
      ...this.apiEndpoint(),
      this.validatePagination(),
      this.validate([
        param('department')
          .trim()
          .notEmpty()
          .withMessage('Department parameter is required')
      ]),
      ErrorHandlerMiddleware.asyncHandler(this.employeeController.getEmployeesByDepartment.bind(this.employeeController))
    );

    /**
     * @route GET /api/employees/district/:district
     * @desc Get employees by district
     * @access Private
     */
    this.router.get(
      '/district/:district',
      ...this.apiEndpoint(),
      this.validatePagination(),
      this.validate([
        param('district')
          .trim()
          .notEmpty()
          .withMessage('District parameter is required')
      ]),
      ErrorHandlerMiddleware.asyncHandler(this.employeeController.getEmployeesByDistrict.bind(this.employeeController))
    );

    /**
     * @route GET /api/employees/search
     * @desc Search employees with advanced filters
     * @access Private
     */
    this.router.get(
      '/search',
      ...this.apiEndpoint(),
      this.validatePagination(),
      this.validate([
        query('name')
          .optional()
          .trim()
          .isLength({ min: 2 })
          .withMessage('Name search must be at least 2 characters'),
        query('phoneNumber')
          .optional()
          .matches(/^(\+998|998)?[0-9]{9}$/)
          .withMessage('Invalid phone number format'),
        query('isActive')
          .optional()
          .isBoolean()
          .withMessage('isActive must be true or false')
      ]),
      ErrorHandlerMiddleware.asyncHandler(this.employeeController.getEmployees.bind(this.employeeController))
    );
  }
}