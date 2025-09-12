"use strict";
/**
 * User Routes
 * Defines routes for user authentication and profile management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_validator_1 = require("express-validator");
const tsyringe_1 = require("tsyringe");
const BaseRouter_1 = require("../base/BaseRouter");
const UserController_1 = require("@/presentation/controllers/user/UserController");
const ErrorHandlerMiddleware_1 = require("@/presentation/middlewares/ErrorHandlerMiddleware");
const RateLimitMiddleware_1 = require("@/presentation/middlewares/RateLimitMiddleware");
class UserRoutes extends BaseRouter_1.BaseRouter {
    userController;
    constructor() {
        super();
        this.userController = tsyringe_1.container.resolve(UserController_1.UserController);
    }
    setupRoutes() {
        /**
         * @route POST /api/auth/login
         * @desc User login
         * @access Public
         */
        this.router.post('/login', RateLimitMiddleware_1.RateLimitMiddleware.authRateLimit, ...this.publicEndpoint(), this.validate([
            (0, express_validator_1.body)('username')
                .trim()
                .isLength({ min: 3, max: 50 })
                .withMessage('Username must be between 3 and 50 characters')
                .matches(/^[a-zA-Z0-9_-]+$/)
                .withMessage('Username can only contain letters, numbers, hyphens and underscores'),
            (0, express_validator_1.body)('password')
                .isLength({ min: 6 })
                .withMessage('Password must be at least 6 characters long')
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.userController.login.bind(this.userController)));
        /**
         * @route POST /api/auth/logout
         * @desc User logout
         * @access Private
         */
        this.router.post('/logout', this.requireAuth(), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.userController.logout.bind(this.userController)));
        /**
         * @route GET /api/auth/profile
         * @desc Get current user profile
         * @access Private
         */
        this.router.get('/profile', ...this.authenticatedEndpoint(), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.userController.getProfile.bind(this.userController)));
        /**
         * @route PUT /api/auth/profile
         * @desc Update user profile
         * @access Private
         */
        this.router.put('/profile', ...this.authenticatedEndpoint(), this.validate([
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
            (0, express_validator_1.body)('district')
                .optional()
                .trim()
                .isLength({ max: 100 })
                .withMessage('District must not exceed 100 characters'),
            (0, express_validator_1.body)('department')
                .optional()
                .trim()
                .isLength({ max: 100 })
                .withMessage('Department must not exceed 100 characters')
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.userController.updateProfile.bind(this.userController)));
        /**
         * @route PUT /api/auth/change-password
         * @desc Change user password
         * @access Private
         */
        this.router.put('/change-password', RateLimitMiddleware_1.RateLimitMiddleware.authRateLimit, ...this.authenticatedEndpoint(), this.validate([
            (0, express_validator_1.body)('currentPassword')
                .notEmpty()
                .withMessage('Current password is required'),
            (0, express_validator_1.body)('newPassword')
                .isLength({ min: 8 })
                .withMessage('New password must be at least 8 characters long')
                .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
                .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
            (0, express_validator_1.body)('confirmPassword')
                .notEmpty()
                .withMessage('Password confirmation is required')
                .custom((value, { req }) => {
                if (value !== req.body.newPassword) {
                    throw new Error('Password confirmation does not match new password');
                }
                return true;
            })
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.userController.changePassword.bind(this.userController)));
        /**
         * @route POST /api/auth/refresh
         * @desc Refresh user session
         * @access Private
         */
        this.router.post('/refresh', this.requireAuth(), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.userController.refreshSession.bind(this.userController)));
        /**
         * @route GET /api/auth/check
         * @desc Check authentication status
         * @access Private
         */
        this.router.get('/check', this.requireAuth(), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.userController.checkAuth.bind(this.userController)));
        /**
         * @route GET /api/auth/permissions
         * @desc Get user permissions
         * @access Private
         */
        this.router.get('/permissions', ...this.authenticatedEndpoint(), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.userController.getPermissions.bind(this.userController)));
        /**
         * @route GET /api/auth/me
         * @desc Get current user info (alias for profile)
         * @access Private
         */
        this.router.get('/me', ...this.authenticatedEndpoint(), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.userController.getProfile.bind(this.userController)));
    }
}
exports.UserRoutes = UserRoutes;
//# sourceMappingURL=UserRoutes.js.map