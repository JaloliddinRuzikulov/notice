/**
 * User Routes
 * Defines routes for user authentication and profile management
 */

import { body } from 'express-validator';
import { container } from 'tsyringe';
import { BaseRouter } from '../base/BaseRouter';
import { UserController } from '@/presentation/controllers/user/UserController';
import { ErrorHandlerMiddleware } from '@/presentation/middlewares/ErrorHandlerMiddleware';
import { RateLimitMiddleware } from '@/presentation/middlewares/RateLimitMiddleware';

export class UserRoutes extends BaseRouter {
  private userController: UserController;

  constructor() {
    super();
    this.userController = container.resolve(UserController);
    
    // Debug: Check if userController was resolved properly
    if (!this.userController) {
      throw new Error('UserController could not be resolved from DI container');
    }
    if (typeof this.userController.login !== 'function') {
      throw new Error('UserController.login method is not available');
    }
    
    // Now initialize routes after controller is ready
    this.initialize();
  }

  protected setupRoutes(): void {
    /**
     * @route POST /api/auth/login
     * @desc User login
     * @access Public
     */
    this.router.post(
      '/login',
      RateLimitMiddleware.authRateLimit,
      ...this.publicEndpoint(),
      this.validate([
        body('username')
          .trim()
          .isLength({ min: 3, max: 50 })
          .withMessage('Username must be between 3 and 50 characters')
          .matches(/^[a-zA-Z0-9_-]+$/)
          .withMessage('Username can only contain letters, numbers, hyphens and underscores'),
        body('password')
          .isLength({ min: 6 })
          .withMessage('Password must be at least 6 characters long')
      ]),
      ErrorHandlerMiddleware.asyncHandler(this.userController.login.bind(this.userController))
    );

    /**
     * @route POST /api/auth/logout
     * @desc User logout
     * @access Private
     */
    this.router.post(
      '/logout',
      this.requireAuth(),
      ErrorHandlerMiddleware.asyncHandler(this.userController.logout.bind(this.userController))
    );

    /**
     * @route GET /api/auth/profile
     * @desc Get current user profile
     * @access Private
     */
    this.router.get(
      '/profile',
      ...this.authenticatedEndpoint(),
      ErrorHandlerMiddleware.asyncHandler(this.userController.getProfile.bind(this.userController))
    );

    /**
     * @route PUT /api/auth/profile
     * @desc Update user profile
     * @access Private
     */
    this.router.put(
      '/profile',
      ...this.authenticatedEndpoint(),
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
        body('district')
          .optional()
          .trim()
          .isLength({ max: 100 })
          .withMessage('District must not exceed 100 characters'),
        body('department')
          .optional()
          .trim()
          .isLength({ max: 100 })
          .withMessage('Department must not exceed 100 characters')
      ]),
      ErrorHandlerMiddleware.asyncHandler(this.userController.updateProfile.bind(this.userController))
    );

    /**
     * @route PUT /api/auth/change-password
     * @desc Change user password
     * @access Private
     */
    this.router.put(
      '/change-password',
      RateLimitMiddleware.authRateLimit,
      ...this.authenticatedEndpoint(),
      this.validate([
        body('currentPassword')
          .notEmpty()
          .withMessage('Current password is required'),
        body('newPassword')
          .isLength({ min: 8 })
          .withMessage('New password must be at least 8 characters long')
          .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
          .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
        body('confirmPassword')
          .notEmpty()
          .withMessage('Password confirmation is required')
          .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
              throw new Error('Password confirmation does not match new password');
            }
            return true;
          })
      ]),
      ErrorHandlerMiddleware.asyncHandler(this.userController.changePassword.bind(this.userController))
    );

    /**
     * @route POST /api/auth/refresh
     * @desc Refresh user session
     * @access Private
     */
    this.router.post(
      '/refresh',
      this.requireAuth(),
      ErrorHandlerMiddleware.asyncHandler(this.userController.refreshSession.bind(this.userController))
    );

    /**
     * @route GET /api/auth/check
     * @desc Check authentication status
     * @access Private
     */
    this.router.get(
      '/check',
      this.requireAuth(),
      ErrorHandlerMiddleware.asyncHandler(this.userController.checkAuth.bind(this.userController))
    );

    /**
     * @route GET /api/auth/permissions
     * @desc Get user permissions
     * @access Private
     */
    this.router.get(
      '/permissions',
      ...this.authenticatedEndpoint(),
      ErrorHandlerMiddleware.asyncHandler(this.userController.getPermissions.bind(this.userController))
    );

    /**
     * @route GET /api/auth/me
     * @desc Get current user info (alias for profile)
     * @access Private
     */
    this.router.get(
      '/me',
      ...this.authenticatedEndpoint(),
      ErrorHandlerMiddleware.asyncHandler(this.userController.getProfile.bind(this.userController))
    );
  }
}