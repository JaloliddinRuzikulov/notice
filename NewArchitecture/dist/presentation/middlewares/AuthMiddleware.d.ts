/**
 * Authentication Middleware
 * Handles user authentication and authorization
 */
import { Request, Response, NextFunction } from 'express';
import { IUserRepository } from '@/core/domain/repositories/IUserRepository';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        username: string;
        role: string;
        permissions: string[];
    };
}
export declare class AuthMiddleware {
    private userRepository;
    constructor(userRepository: IUserRepository);
    /**
     * Authenticate user based on session
     */
    authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Authorize user based on required permissions
     */
    authorize: (requiredPermissions: string | string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    /**
     * Authorize user based on role
     */
    requireRole: (requiredRoles: string | string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    /**
     * Optional authentication - user info if available, but doesn't block request
     */
    optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Check if user owns the resource or has admin privileges
     */
    ownerOrAdmin: (getUserIdFromRequest: (req: Request) => string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=AuthMiddleware.d.ts.map