/**
 * Base Router
 * Provides common routing functionality
 */
import { Router } from 'express';
import { AuthMiddleware } from '@/presentation/middlewares/AuthMiddleware';
export declare abstract class BaseRouter {
    protected router: Router;
    protected authMiddleware: AuthMiddleware;
    constructor();
    protected abstract setupRoutes(): void;
    getRouter(): Router;
    /**
     * Apply authentication middleware
     */
    protected requireAuth(): (req: import("@/presentation/middlewares/AuthMiddleware").AuthenticatedRequest, res: import("express").Response, next: import("express").NextFunction) => Promise<void>;
    /**
     * Apply authorization middleware
     */
    protected requirePermissions(permissions: string | string[]): (req: import("@/presentation/middlewares/AuthMiddleware").AuthenticatedRequest, res: import("express").Response, next: import("express").NextFunction) => void;
    /**
     * Apply role-based authorization
     */
    protected requireRole(roles: string | string[]): (req: import("@/presentation/middlewares/AuthMiddleware").AuthenticatedRequest, res: import("express").Response, next: import("express").NextFunction) => void;
    /**
     * Apply optional authentication
     */
    protected optionalAuth(): (req: import("@/presentation/middlewares/AuthMiddleware").AuthenticatedRequest, res: import("express").Response, next: import("express").NextFunction) => Promise<void>;
    /**
     * Apply validation middleware
     */
    protected validate(validations: any[]): (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<void>;
    /**
     * Apply rate limiting
     */
    protected rateLimit(options: any): (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void;
    /**
     * Apply pagination validation
     */
    protected validatePagination(): (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void;
    /**
     * Apply date range validation
     */
    protected validateDateRange(startParam?: string, endParam?: string): (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void;
    /**
     * Apply UUID validation
     */
    protected validateUUID(paramName?: string): (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void;
    /**
     * Apply required parameters validation
     */
    protected requireParams(params: string[]): (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void;
    /**
     * Apply file upload validation
     */
    protected validateFileUpload(options?: any): (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void;
    /**
     * Common middleware stack for authenticated endpoints
     */
    protected authenticatedEndpoint(): ((req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void)[];
    /**
     * Common middleware stack for public endpoints
     */
    protected publicEndpoint(): ((req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void)[];
    /**
     * Common middleware stack for admin endpoints
     */
    protected adminEndpoint(): ((req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void)[];
    /**
     * Common middleware stack for API endpoints with rate limiting
     */
    protected apiEndpoint(): ((req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void)[];
}
//# sourceMappingURL=BaseRouter.d.ts.map