/**
 * Rate Limiting Middleware
 * Provides rate limiting functionality for API endpoints
 */
import { Request, Response, NextFunction } from 'express';
export interface RateLimitOptions {
    windowMs: number;
    max: number;
    message?: string;
    statusCode?: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: Request) => string;
    skip?: (req: Request) => boolean;
}
export interface RateLimitInfo {
    limit: number;
    current: number;
    remaining: number;
    resetTime: Date;
}
export declare class RateLimitMiddleware {
    private static stores;
    /**
     * Create rate limiting middleware
     */
    static createRateLimit: (options: RateLimitOptions) => (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Strict rate limit for authentication endpoints
     */
    static authRateLimit: (req: Request, res: Response, next: NextFunction) => void;
    /**
     * General API rate limit
     */
    static apiRateLimit: (req: Request, res: Response, next: NextFunction) => void;
    /**
     * File upload rate limit
     */
    static uploadRateLimit: (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Broadcast creation rate limit
     */
    static broadcastRateLimit: (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Default key generator
     */
    private static defaultKeyGenerator;
    /**
     * Get client IP address
     */
    private static getClientIP;
    /**
     * Skip rate limiting for certain conditions
     */
    static skipIf: (condition: (req: Request) => boolean) => (req: Request) => boolean;
    /**
     * Skip rate limiting for whitelisted IPs
     */
    static skipWhitelistedIPs: (whitelistedIPs: string[]) => (req: Request) => boolean;
    /**
     * Skip rate limiting for admin users
     */
    static skipAdminUsers: (req: Request) => boolean;
    /**
     * Clean up expired entries (should be called periodically)
     */
    static cleanup: () => void;
    /**
     * Get current rate limit status for a key
     */
    static getRateLimitStatus: (storeId: string, key: string) => RateLimitInfo | null;
}
//# sourceMappingURL=RateLimitMiddleware.d.ts.map