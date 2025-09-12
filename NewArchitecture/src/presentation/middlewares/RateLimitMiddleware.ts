/**
 * Rate Limiting Middleware
 * Provides rate limiting functionality for API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { injectable } from 'tsyringe';

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
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

@injectable()
export class RateLimitMiddleware {
  private static stores: Map<string, Map<string, { count: number; resetTime: number }>> = new Map();

  /**
   * Create rate limiting middleware
   */
  static createRateLimit = (options: RateLimitOptions) => {
    const {
      windowMs,
      max,
      message = 'Too many requests, please try again later',
      statusCode = 429,
      skipSuccessfulRequests = false,
      skipFailedRequests = false,
      keyGenerator = RateLimitMiddleware.defaultKeyGenerator,
      skip = () => false
    } = options;

    const storeId = `${windowMs}-${max}`;
    
    if (!RateLimitMiddleware.stores.has(storeId)) {
      RateLimitMiddleware.stores.set(storeId, new Map());
    }

    const store = RateLimitMiddleware.stores.get(storeId)!;

    return (req: Request, res: Response, next: NextFunction): void => {
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
          (req as any).rateLimit = {
            limit: max,
            current: rateLimitInfo.count,
            remaining: 0,
            resetTime: new Date(rateLimitInfo.resetTime)
          } as RateLimitInfo;

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
        (req as any).rateLimit = {
          limit: max,
          current: rateLimitInfo.count,
          remaining,
          resetTime: new Date(rateLimitInfo.resetTime)
        } as RateLimitInfo;

        // Handle response to potentially skip counting
        const originalSend = res.send;
        res.send = function(data) {
          const shouldSkip = (skipSuccessfulRequests && res.statusCode < 400) ||
                           (skipFailedRequests && res.statusCode >= 400);

          if (shouldSkip && rateLimitInfo) {
            rateLimitInfo.count--;
          }

          return originalSend.call(this, data);
        };

        next();

      } catch (error) {
        console.error('Rate limiting error:', error);
        next(); // Continue on error to avoid breaking the app
      }
    };
  };

  /**
   * Strict rate limit for authentication endpoints
   */
  static authRateLimit = RateLimitMiddleware.createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many authentication attempts, please try again in 15 minutes',
    skipSuccessfulRequests: true,
    keyGenerator: (req) => `auth:${RateLimitMiddleware.getClientIP(req)}`
  });

  /**
   * General API rate limit
   */
  static apiRateLimit = RateLimitMiddleware.createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many API requests, please try again later',
    keyGenerator: (req) => {
      const user = (req as any).user;
      return user ? `api:user:${user.id}` : `api:ip:${RateLimitMiddleware.getClientIP(req)}`;
    }
  });

  /**
   * File upload rate limit
   */
  static uploadRateLimit = RateLimitMiddleware.createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads per hour
    message: 'Too many file uploads, please try again in an hour',
    keyGenerator: (req) => {
      const user = (req as any).user;
      return user ? `upload:user:${user.id}` : `upload:ip:${RateLimitMiddleware.getClientIP(req)}`;
    }
  });

  /**
   * Broadcast creation rate limit
   */
  static broadcastRateLimit = RateLimitMiddleware.createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 broadcasts per hour
    message: 'Too many broadcasts created, please try again in an hour',
    keyGenerator: (req) => {
      const user = (req as any).user;
      return `broadcast:user:${user?.id || 'anonymous'}`;
    }
  });

  /**
   * Default key generator
   */
  private static defaultKeyGenerator = (req: Request): string => {
    return RateLimitMiddleware.getClientIP(req);
  };

  /**
   * Get client IP address
   */
  private static getClientIP(req: Request): string {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection as any)?.socket?.remoteAddress ||
           'unknown';
  };

  /**
   * Skip rate limiting for certain conditions
   */
  static skipIf = (condition: (req: Request) => boolean) => {
    return condition;
  };

  /**
   * Skip rate limiting for whitelisted IPs
   */
  static skipWhitelistedIPs = (whitelistedIPs: string[]) => {
    return (req: Request): boolean => {
      const clientIP = RateLimitMiddleware.getClientIP(req);
      return whitelistedIPs.includes(clientIP);
    };
  };

  /**
   * Skip rate limiting for admin users
   */
  static skipAdminUsers = (req: Request): boolean => {
    const user = (req as any).user;
    return user && user.role === 'admin';
  };

  /**
   * Clean up expired entries (should be called periodically)
   */
  static cleanup = (): void => {
    const now = Date.now();
    
    RateLimitMiddleware.stores.forEach(store => {
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
  static getRateLimitStatus = (storeId: string, key: string): RateLimitInfo | null => {
    const store = RateLimitMiddleware.stores.get(storeId);
    if (!store) return null;

    const rateLimitInfo = store.get(key);
    if (!rateLimitInfo) return null;

    const [windowMs, max] = storeId.split('-').map(Number);
    
    return {
      limit: max,
      current: rateLimitInfo.count,
      remaining: Math.max(0, max - rateLimitInfo.count),
      resetTime: new Date(rateLimitInfo.resetTime)
    };
  };
}

// Clean up expired entries every 10 minutes
setInterval(() => {
  RateLimitMiddleware.cleanup();
}, 10 * 60 * 1000);