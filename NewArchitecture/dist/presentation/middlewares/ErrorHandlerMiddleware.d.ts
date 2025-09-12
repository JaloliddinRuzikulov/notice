/**
 * Error Handler Middleware
 * Centralized error handling for the application
 */
import { Request, Response, NextFunction } from 'express';
export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
    errors?: string[];
}
export declare class ErrorHandlerMiddleware {
    /**
     * Global error handler
     */
    static handleError: (err: AppError, req: Request, res: Response, next: NextFunction) => void;
    /**
     * Handle 404 errors
     */
    static handleNotFound: (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Async error wrapper
     */
    static asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Create operational error
     */
    static createError: (message: string, statusCode?: number, errors?: string[]) => AppError;
    /**
     * Extract validation errors
     */
    private static extractValidationErrors;
    /**
     * Handle Multer errors
     */
    private static handleMulterError;
    /**
     * Rate limit error handler
     */
    static handleRateLimit: (req: Request, res: Response) => void;
    /**
     * CORS error handler
     */
    static handleCORS: (req: Request, res: Response) => void;
    /**
     * Request timeout handler
     */
    static handleTimeout: (req: Request, res: Response) => void;
    /**
     * Graceful shutdown handler
     */
    static gracefulShutdown: (server: any) => (signal: string) => void;
    /**
     * Unhandled promise rejection handler
     */
    static handleUnhandledRejection: (reason: any, promise: Promise<any>) => void;
    /**
     * Uncaught exception handler
     */
    static handleUncaughtException: (error: Error) => void;
}
//# sourceMappingURL=ErrorHandlerMiddleware.d.ts.map