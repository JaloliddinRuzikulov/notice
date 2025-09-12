/**
 * User Controller
 * Handles HTTP requests for user management and authentication
 */
import { Request, Response } from 'express';
import { BaseController } from '../base/BaseController';
import { LoginUserUseCase } from '@/application/usecases/user/LoginUserUseCase';
import { LogoutUserUseCase } from '@/application/usecases/user/LogoutUserUseCase';
import { GetUserProfileUseCase } from '@/application/usecases/user/GetUserProfileUseCase';
import { UserMapper } from '@/application/mappers/user/UserMapper';
export declare class UserController extends BaseController {
    private loginUserUseCase;
    private logoutUserUseCase;
    private getUserProfileUseCase;
    private userMapper;
    constructor(loginUserUseCase: LoginUserUseCase, logoutUserUseCase: LogoutUserUseCase, getUserProfileUseCase: GetUserProfileUseCase, userMapper: UserMapper);
    /**
     * User login
     * POST /api/auth/login
     */
    login(req: Request, res: Response): Promise<Response>;
    /**
     * User logout
     * POST /api/auth/logout
     */
    logout(req: Request, res: Response): Promise<Response>;
    /**
     * Get current user profile
     * GET /api/auth/profile
     */
    getProfile(req: Request, res: Response): Promise<Response>;
    /**
     * Update user profile
     * PUT /api/auth/profile
     */
    updateProfile(req: Request, res: Response): Promise<Response>;
    /**
     * Change user password
     * PUT /api/auth/change-password
     */
    changePassword(req: Request, res: Response): Promise<Response>;
    /**
     * Refresh session
     * POST /api/auth/refresh
     */
    refreshSession(req: Request, res: Response): Promise<Response>;
    /**
     * Check authentication status
     * GET /api/auth/check
     */
    checkAuth(req: Request, res: Response): Promise<Response>;
    /**
     * Get user permissions
     * GET /api/auth/permissions
     */
    getPermissions(req: Request, res: Response): Promise<Response>;
}
//# sourceMappingURL=UserController.d.ts.map