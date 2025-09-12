/**
 * User Controller
 * Handles HTTP requests for user management and authentication
 */

import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { BaseController } from '../base/BaseController';
import { LoginUserUseCase } from '@/application/usecases/user/LoginUserUseCase';
import { LogoutUserUseCase } from '@/application/usecases/user/LogoutUserUseCase';
import { GetUserProfileUseCase } from '@/application/usecases/user/GetUserProfileUseCase';
import { UserMapper } from '@/application/mappers/user/UserMapper';
import { LoginRequestDTO, ChangePasswordDTO } from '@/application/dto/user/UserDTO';

@injectable()
export class UserController extends BaseController {
  constructor(
    @inject(LoginUserUseCase)
    private loginUserUseCase: LoginUserUseCase,
    @inject(LogoutUserUseCase)
    private logoutUserUseCase: LogoutUserUseCase,
    @inject(GetUserProfileUseCase)
    private getUserProfileUseCase: GetUserProfileUseCase,
    @inject(UserMapper)
    private userMapper: UserMapper
  ) {
    super();
  }

  /**
   * User login
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<Response> {
    try {
      const validation = this.validateRequestBody(req, ['username', 'password']);

      if (!validation.isValid) {
        return this.badRequest(res, 'Validation failed', validation.errors);
      }

      const loginRequest: LoginRequestDTO = {
        username: this.sanitizeInput(req.body.username),
        password: req.body.password, // Don't sanitize password to preserve original
        ipAddress: this.getIPAddress(req)
      };

      const result = await this.loginUserUseCase.execute(loginRequest);

      if (result.success && result.data) {
        // Set session cookie if needed
        if (req.session) {
          (req.session as any).userId = result.data.user.id;
          (req.session as any).sessionId = result.data.sessionId;
        }

        return this.success(res, {
          user: result.data.user,
          sessionId: result.data.sessionId
        }, 'Login successful');
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error during login:', error);
      return this.internalError(res, 'Login failed');
    }
  }

  /**
   * User logout
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response): Promise<Response> {
    try {
      const user = this.getUserFromRequest(req);
      const sessionId = req.body.sessionId || (req.session as any)?.sessionId;

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

    } catch (error) {
      console.error('Error during logout:', error);
      return this.internalError(res, 'Logout failed');
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/profile
   */
  async getProfile(req: Request, res: Response): Promise<Response> {
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

    } catch (error) {
      console.error('Error getting user profile:', error);
      return this.internalError(res, 'Failed to retrieve user profile');
    }
  }

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  async updateProfile(req: Request, res: Response): Promise<Response> {
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

    } catch (error) {
      console.error('Error updating user profile:', error);
      return this.internalError(res, 'Failed to update user profile');
    }
  }

  /**
   * Change user password
   * PUT /api/auth/change-password
   */
  async changePassword(req: Request, res: Response): Promise<Response> {
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

      const changePasswordDTO: ChangePasswordDTO = {
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

    } catch (error) {
      console.error('Error changing password:', error);
      return this.internalError(res, 'Failed to change password');
    }
  }

  /**
   * Refresh session
   * POST /api/auth/refresh
   */
  async refreshSession(req: Request, res: Response): Promise<Response> {
    try {
      const user = this.getUserFromRequest(req);
      const sessionId = req.body.sessionId || (req.session as any)?.sessionId;

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

    } catch (error) {
      console.error('Error refreshing session:', error);
      return this.internalError(res, 'Failed to refresh session');
    }
  }

  /**
   * Check authentication status
   * GET /api/auth/check
   */
  async checkAuth(req: Request, res: Response): Promise<Response> {
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

    } catch (error) {
      console.error('Error checking auth status:', error);
      return this.internalError(res, 'Failed to check authentication status');
    }
  }

  /**
   * Get user permissions
   * GET /api/auth/permissions
   */
  async getPermissions(req: Request, res: Response): Promise<Response> {
    try {
      const user = this.getUserFromRequest(req);

      if (!user.id) {
        return this.unauthorized(res, 'User not authenticated');
      }

      return this.success(res, {
        permissions: user.permissions,
        role: user.role
      });

    } catch (error) {
      console.error('Error getting user permissions:', error);
      return this.internalError(res, 'Failed to retrieve user permissions');
    }
  }
}