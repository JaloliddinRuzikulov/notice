"use strict";
/**
 * Rate Limiting Middleware
 * Provides rate limiting functionality for API endpoints
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RateLimitMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitMiddleware = void 0;
const tsyringe_1 = require("tsyringe");
let RateLimitMiddleware = class RateLimitMiddleware {
    static { RateLimitMiddleware_1 = this; }
    static stores = new Map();
    /**
     * Create rate limiting middleware
     */
    static createRateLimit = (options) => {
        const { windowMs, max, message = 'Too many requests, please try again later', statusCode = 429, skipSuccessfulRequests = false, skipFailedRequests = false, keyGenerator = RateLimitMiddleware_1.defaultKeyGenerator, skip = () => false } = options;
        const storeId = `${windowMs}-${max}`;
        if (!RateLimitMiddleware_1.stores.has(storeId)) {
            RateLimitMiddleware_1.stores.set(storeId, new Map());
        }
        const store = RateLimitMiddleware_1.stores.get(storeId);
        return (req, res, next) => {
            try {
                // Skip if condition is met
                if (skip(req)) {
                    next();
                    return;
                }
                const key = keyGenerator(req);
                const now = Date.now();
                const windowStart = Math.floor(now / windowMs) * windowMs;
                const resetTime = windowStart + windowMs;
                // Get or create rate limit info for this key
                let rateLimitInfo = store.get(key);
                if (!rateLimitInfo || rateLimitInfo.resetTime <= now) {
                    // Create new window
                    rateLimitInfo = {
                        count: 0,
                        resetTime: resetTime
                    };
                    store.set(key, rateLimitInfo);
                }
                // Check if limit exceeded
                if (rateLimitInfo.count >= max) {
                    // Set rate limit headers
                    res.set({
                        'X-RateLimit-Limit': max.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': new Date(rateLimitInfo.resetTime).toISOString(),
                        'Retry-After': Math.ceil((rateLimitInfo.resetTime - now) / 1000).toString()
                    });
                    // Attach rate limit info to request
                    req.rateLimit = {
                        limit: max,
                        current: rateLimitInfo.count,
                        remaining: 0,
                        resetTime: new Date(rateLimitInfo.resetTime)
                    };
                    res.status(statusCode).json({
                        success: false,
                        error: message,
                        retryAfter: Math.ceil((rateLimitInfo.resetTime - now) / 1000)
                    });
                    return;
                }
                // Increment counter (will be decremented if request should be skipped)
                rateLimitInfo.count++;
                // Set rate limit headers
                const remaining = Math.max(0, max - rateLimitInfo.count);
                res.set({
                    'X-RateLimit-Limit': max.toString(),
                    'X-RateLimit-Remaining': remaining.toString(),
                    'X-RateLimit-Reset': new Date(rateLimitInfo.resetTime).toISOString()
                });
                // Attach rate limit info to request
                req.rateLimit = {
                    limit: max,
                    current: rateLimitInfo.count,
                    remaining,
                    resetTime: new Date(rateLimitInfo.resetTime)
                };
                // Handle response to potentially skip counting
                const originalSend = res.send;
                res.send = function (data) {
                    const shouldSkip = (skipSuccessfulRequests && res.statusCode < 400) ||
                        (skipFailedRequests && res.statusCode >= 400);
                    if (shouldSkip && rateLimitInfo) {
                        rateLimitInfo.count--;
                    }
                    return originalSend.call(this, data);
                };
                next();
            }
            catch (error) {
                console.error('Rate limiting error:', error);
                next(); // Continue on error to avoid breaking the app
            }
        };
    };
    /**
     * Strict rate limit for authentication endpoints
     */
    static authRateLimit = RateLimitMiddleware_1.createRateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 attempts per window
        message: 'Too many authentication attempts, please try again in 15 minutes',
        skipSuccessfulRequests: true,
        keyGenerator: (req) => `auth:${RateLimitMiddleware_1.getClientIP(req)}`
    });
    /**
     * General API rate limit
     */
    static apiRateLimit = RateLimitMiddleware_1.createRateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // 100 requests per window
        message: 'Too many API requests, please try again later',
        keyGenerator: (req) => {
            const user = req.user;
            return user ? `api:user:${user.id}` : `api:ip:${RateLimitMiddleware_1.getClientIP(req)}`;
        }
    });
    /**
     * File upload rate limit
     */
    static uploadRateLimit = RateLimitMiddleware_1.createRateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10, // 10 uploads per hour
        message: 'Too many file uploads, please try again in an hour',
        keyGenerator: (req) => {
            const user = req.user;
            return user ? `upload:user:${user.id}` : `upload:ip:${RateLimitMiddleware_1.getClientIP(req)}`;
        }
    });
    /**
     * Broadcast creation rate limit
     */
    static broadcastRateLimit = RateLimitMiddleware_1.createRateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 20, // 20 broadcasts per hour
        message: 'Too many broadcasts created, please try again in an hour',
        keyGenerator: (req) => {
            const user = req.user;
            return `broadcast:user:${user?.id || 'anonymous'}`;
        }
    });
    /**
     * Default key generator
     */
    static defaultKeyGenerator = (req) => {
        return RateLimitMiddleware_1.getClientIP(req);
    };
    /**
     * Get client IP address
     */
    static getClientIP(req) {
        return req.ip ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection?.socket?.remoteAddress ||
            'unknown';
    }
    ;
    /**
     * Skip rate limiting for certain conditions
     */
    static skipIf = (condition) => {
        return condition;
    };
    /**
     * Skip rate limiting for whitelisted IPs
     */
    static skipWhitelistedIPs = (whitelistedIPs) => {
        return (req) => {
            const clientIP = RateLimitMiddleware_1.getClientIP(req);
            return whitelistedIPs.includes(clientIP);
        };
    };
    /**
     * Skip rate limiting for admin users
     */
    static skipAdminUsers = (req) => {
        const user = req.user;
        return user && user.role === 'admin';
    };
    /**
     * Clean up expired entries (should be called periodically)
     */
    static cleanup = () => {
        const now = Date.now();
        RateLimitMiddleware_1.stores.forEach(store => {
            store.forEach((value, key) => {
                if (value.resetTime <= now) {
                    store.delete(key);
                }
            });
        });
    };
    /**
     * Get current rate limit status for a key
     */
    static getRateLimitStatus = (storeId, key) => {
        const store = RateLimitMiddleware_1.stores.get(storeId);
        if (!store)
            return null;
        const rateLimitInfo = store.get(key);
        if (!rateLimitInfo)
            return null;
        const [windowMs, max] = storeId.split('-').map(Number);
        return {
            limit: max,
            current: rateLimitInfo.count,
            remaining: Math.max(0, max - rateLimitInfo.count),
            resetTime: new Date(rateLimitInfo.resetTime)
        };
    };
};
exports.RateLimitMiddleware = RateLimitMiddleware;
exports.RateLimitMiddleware = RateLimitMiddleware = RateLimitMiddleware_1 = __decorate([
    (0, tsyringe_1.injectable)()
], RateLimitMiddleware);
// Clean up expired entries every 10 minutes
setInterval(() => {
    RateLimitMiddleware.cleanup();
}, 10 * 60 * 1000);
//# sourceMappingURL=RateLimitMiddleware.js.map