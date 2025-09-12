"use strict";
/**
 * User Controller
 * Handles HTTP requests for user management and authentication
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
exports.UserController = void 0;
const tsyringe_1 = require("tsyringe");
const BaseController_1 = require("../base/BaseController");
const LoginUserUseCase_1 = require("@/application/usecases/user/LoginUserUseCase");
const LogoutUserUseCase_1 = require("@/application/usecases/user/LogoutUserUseCase");
const GetUserProfileUseCase_1 = require("@/application/usecases/user/GetUserProfileUseCase");
const UserMapper_1 = require("@/application/mappers/user/UserMapper");
let UserController = class UserController extends BaseController_1.BaseController {
    loginUserUseCase;
    logoutUserUseCase;
    getUserProfileUseCase;
    userMapper;
    constructor(loginUserUseCase, logoutUserUseCase, getUserProfileUseCase, userMapper) {
        super();
        this.loginUserUseCase = loginUserUseCase;
        this.logoutUserUseCase = logoutUserUseCase;
        this.getUserProfileUseCase = getUserProfileUseCase;
        this.userMapper = userMapper;
    }
    /**
     * User login
     * POST /api/auth/login
     */
    async login(req, res) {
        try {
            const validation = this.validateRequestBody(req, ['username', 'password']);
            if (!validation.isValid) {
                return this.badRequest(res, 'Validation failed', validation.errors);
            }
            const loginRequest = {
                username: this.sanitizeInput(req.body.username),
                password: req.body.password, // Don't sanitize password to preserve original
                ipAddress: this.getIPAddress(req)
            };
            const result = await this.loginUserUseCase.execute(loginRequest);
            if (result.success && result.data) {
                // Set session cookie if needed
                if (req.session) {
                    req.session.userId = result.data.user.id;
                    req.session.sessionId = result.data.sessionId;
                }
                return this.success(res, {
                    user: result.data.user,
                    sessionId: result.data.sessionId
                }, 'Login successful');
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error during login:', error);
            return this.internalError(res, 'Login failed');
        }
    }
    /**
     * User logout
     * POST /api/auth/logout
     */
    async logout(req, res) {
        try {
            const user = this.getUserFromRequest(req);
            const sessionId = req.body.sessionId || req.session?.sessionId;
            if (!sessionId) {
                return this.badRequest(res, 'Session ID is required');
            }
            const result = await this.logoutUserUseCase.execute({
                sessionId,
                userId: user.id
            });
            if (result.success) {
                // Clear session
                if (req.session) {
                    req.session.destroy((err) => {
                        if (err) {
                            console.error('Error destroying session:', err);
                        }
                    });
                }
                return this.noContent(res, 'Logout successful');
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error during logout:', error);
            return this.internalError(res, 'Logout failed');
        }
    }
    /**
     * Get current user profile
     * GET /api/auth/profile
     */
    async getProfile(req, res) {
        try {
            const user = this.getUserFromRequest(req);
            if (!user.id) {
                return this.unauthorized(res, 'User not authenticated');
            }
            const result = await this.getUserProfileUseCase.execute({
                userId: user.id
            });
            if (result.success && result.data) {
                return this.success(res, result.data.user);
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error getting user profile:', error);
            return this.internalError(res, 'Failed to retrieve user profile');
        }
    }
    /**
     * Update user profile
     * PUT /api/auth/profile
     */
    async updateProfile(req, res) {
        try {
            const user = this.getUserFromRequest(req);
            if (!user.id) {
                return this.unauthorized(res, 'User not authenticated');
            }
            // This would use an UpdateUserProfileUseCase (not implemented in this example)
            // For now, return method not implemented
            return res.status(501).json({
                success: false,
                error: 'Profile update not implemented yet'
            });
        }
        catch (error) {
            console.error('Error updating user profile:', error);
            return this.internalError(res, 'Failed to update user profile');
        }
    }
    /**
     * Change user password
     * PUT /api/auth/change-password
     */
    async changePassword(req, res) {
        try {
            const user = this.getUserFromRequest(req);
            if (!user.id) {
                return this.unauthorized(res, 'User not authenticated');
            }
            const validation = this.validateRequestBody(req, [
                'currentPassword', 'newPassword', 'confirmPassword'
            ]);
            if (!validation.isValid) {
                return this.badRequest(res, 'Validation failed', validation.errors);
            }
            const changePasswordDTO = {
                currentPassword: req.body.currentPassword,
                newPassword: req.body.newPassword,
                confirmPassword: req.body.confirmPassword
            };
            // Validate new password confirmation
            if (changePasswordDTO.newPassword !== changePasswordDTO.confirmPassword) {
                return this.badRequest(res, 'New password and confirmation do not match');
            }
            // Basic password strength validation
            if (changePasswordDTO.newPassword.length < 8) {
                return this.badRequest(res, 'Password must be at least 8 characters long');
            }
            // This would use a ChangePasswordUseCase (not implemented in this example)
            // For now, return method not implemented
            return res.status(501).json({
                success: false,
                error: 'Password change not implemented yet'
            });
        }
        catch (error) {
            console.error('Error changing password:', error);
            return this.internalError(res, 'Failed to change password');
        }
    }
    /**
     * Refresh session
     * POST /api/auth/refresh
     */
    async refreshSession(req, res) {
        try {
            const user = this.getUserFromRequest(req);
            const sessionId = req.body.sessionId || req.session?.sessionId;
            if (!user.id || !sessionId) {
                return this.unauthorized(res, 'Invalid session');
            }
            // This would use a RefreshSessionUseCase (not implemented in this example)
            // For now, return the current session info
            return this.success(res, {
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    permissions: user.permissions
                },
                sessionId
            }, 'Session refreshed');
        }
        catch (error) {
            console.error('Error refreshing session:', error);
            return this.internalError(res, 'Failed to refresh session');
        }
    }
    /**
     * Check authentication status
     * GET /api/auth/check
     */
    async checkAuth(req, res) {
        try {
            const user = this.getUserFromRequest(req);
            if (!user.id) {
                return this.unauthorized(res, 'Not authenticated');
            }
            return this.success(res, {
                authenticated: true,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    permissions: user.permissions
                }
            });
        }
        catch (error) {
            console.error('Error checking auth status:', error);
            return this.internalError(res, 'Failed to check authentication status');
        }
    }
    /**
     * Get user permissions
     * GET /api/auth/permissions
     */
    async getPermissions(req, res) {
        try {
            const user = this.getUserFromRequest(req);
            if (!user.id) {
                return this.unauthorized(res, 'User not authenticated');
            }
            return this.success(res, {
                permissions: user.permissions,
                role: user.role
            });
        }
        catch (error) {
            console.error('Error getting user permissions:', error);
            return this.internalError(res, 'Failed to retrieve user permissions');
        }
    }
};
exports.UserController = UserController;
exports.UserController = UserController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(LoginUserUseCase_1.LoginUserUseCase)),
    __param(1, (0, tsyringe_1.inject)(LogoutUserUseCase_1.LogoutUserUseCase)),
    __param(2, (0, tsyringe_1.inject)(GetUserProfileUseCase_1.GetUserProfileUseCase)),
    __param(3, (0, tsyringe_1.inject)(UserMapper_1.UserMapper)),
    __metadata("design:paramtypes", [LoginUserUseCase_1.LoginUserUseCase,
        LogoutUserUseCase_1.LogoutUserUseCase,
        GetUserProfileUseCase_1.GetUserProfileUseCase,
        UserMapper_1.UserMapper])
], UserController);
//# sourceMappingURL=UserController.js.map