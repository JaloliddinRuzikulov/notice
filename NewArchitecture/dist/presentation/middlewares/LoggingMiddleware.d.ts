/**
 * Logging Middleware
 * Provides request/response logging functionality
 */
import { Request, Response, NextFunction } from 'express';
export interface LoggingOptions {
    excludePaths?: string[];
    excludeMethods?: string[];
    logBody?: boolean;
    logHeaders?: boolean;
    maxBodyLength?: number;
}
export declare class LoggingMiddleware {
    /**
     * Request logging middleware
     */
    static requestLogger: (options?: LoggingOptions) => (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Security logging middleware
     */
    static securityLogger: (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Performance logging middleware
     */
    static performanceLogger: (thresholdMs?: number) => (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Error logging middleware
     */
    static errorLogger: (err: Error, req: Request, res: Response, next: NextFunction) => void;
    /**
     * Get client IP address
     */
    private static getClientIP;
    /**
     * Generate correlation ID for request tracking
     */
    private static generateCorrelationId;
    /**
     * Sanitize headers for logging
     */
    private static sanitizeHeaders;
    /**
     * Sanitize request body for logging
     */
    private static sanitizeBody;
    /**
     * Health check logging (minimal logging for health endpoints)
     */
    static healthCheckLogger: (req: Request, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=LoggingMiddleware.d.ts.map