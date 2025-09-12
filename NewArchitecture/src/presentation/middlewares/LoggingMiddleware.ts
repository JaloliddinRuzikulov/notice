/**
 * Logging Middleware
 * Provides request/response logging functionality
 */

import { Request, Response, NextFunction } from 'express';
import { injectable } from 'tsyringe';

export interface LoggingOptions {
  excludePaths?: string[];
  excludeMethods?: string[];
  logBody?: boolean;
  logHeaders?: boolean;
  maxBodyLength?: number;
}

@injectable()
export class LoggingMiddleware {
  /**
   * Request logging middleware
   */
  static requestLogger = (options: LoggingOptions = {}) => {
    const {
      excludePaths = ['/health', '/favicon.ico'],
      excludeMethods = [],
      logBody = false,
      logHeaders = false,
      maxBodyLength = 1000
    } = options;

    return (req: Request, res: Response, next: NextFunction): void => {
      // Skip logging for excluded paths
      if (excludePaths.some(path => req.path.includes(path))) {
        next();
        return;
      }

      // Skip logging for excluded methods
      if (excludeMethods.includes(req.method)) {
        next();
        return;
      }

      const startTime = Date.now();
      
      // Log request
      const requestLog: any = {
        timestamp: new Date().toISOString(),
        type: 'REQUEST',
        method: req.method,
        url: req.url,
        path: req.path,
        ip: LoggingMiddleware.getClientIP(req),
        userAgent: req.get('User-Agent'),
        correlationId: LoggingMiddleware.generateCorrelationId()
      };

      // Add user info if available
      if ((req as any).user) {
        requestLog.user = {
          id: (req as any).user.id,
          username: (req as any).user.username,
          role: (req as any).user.role
        };
      }

      // Add headers if enabled
      if (logHeaders) {
        requestLog.headers = LoggingMiddleware.sanitizeHeaders(req.headers);
      }

      // Add body if enabled (for non-GET requests)
      if (logBody && req.method !== 'GET' && req.body) {
        requestLog.body = LoggingMiddleware.sanitizeBody(req.body, maxBodyLength);
      }

      console.log(JSON.stringify(requestLog));

      // Store correlation ID and start time for response logging
      (req as any).correlationId = requestLog.correlationId;
      (req as any).startTime = startTime;

      // Hook into response finish event
      const originalSend = res.send;
      res.send = function(data) {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Log response
        const responseLog: any = {
          timestamp: new Date().toISOString(),
          type: 'RESPONSE',
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          correlationId: requestLog.correlationId
        };

        // Add response size
        if (data) {
          responseLog.responseSize = Buffer.byteLength(data, 'utf8');
        }

        // Log error responses with more detail
        if (res.statusCode >= 400) {
          responseLog.level = 'ERROR';
          if (data && typeof data === 'string') {
            try {
              const parsedData = JSON.parse(data);
              responseLog.error = parsedData.error;
              responseLog.errors = parsedData.errors;
            } catch (e) {
              responseLog.responseData = data.substring(0, 500);
            }
          }
        }

        console.log(JSON.stringify(responseLog));

        return originalSend.call(this, data);
      };

      next();
    };
  };

  /**
   * Security logging middleware
   */
  static securityLogger = (req: Request, res: Response, next: NextFunction): void => {
    const securityEvents: string[] = [];

    // Check for suspicious patterns
    if (req.url.includes('../') || req.url.includes('..\\')) {
      securityEvents.push('PATH_TRAVERSAL_ATTEMPT');
    }

    if (req.url.toLowerCase().includes('script') || req.url.includes('<')) {
      securityEvents.push('XSS_ATTEMPT');
    }

    if (req.url.includes('union') || req.url.includes('select') || req.url.includes('drop')) {
      securityEvents.push('SQL_INJECTION_ATTEMPT');
    }

    // Check for suspicious headers
    const suspiciousHeaders = ['x-forwarded-host', 'x-real-ip', 'x-originating-ip'];
    suspiciousHeaders.forEach(header => {
      if (req.headers[header]) {
        securityEvents.push(`SUSPICIOUS_HEADER_${header.toUpperCase()}`);
      }
    });

    // Log security events
    if (securityEvents.length > 0) {
      const securityLog = {
        timestamp: new Date().toISOString(),
        type: 'SECURITY_EVENT',
        events: securityEvents,
        method: req.method,
        url: req.url,
        ip: LoggingMiddleware.getClientIP(req),
        userAgent: req.get('User-Agent'),
        headers: LoggingMiddleware.sanitizeHeaders(req.headers)
      };

      console.warn(JSON.stringify(securityLog));
    }

    next();
  };

  /**
   * Performance logging middleware
   */
  static performanceLogger = (thresholdMs: number = 1000) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const startTime = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - startTime;

        if (duration > thresholdMs) {
          const performanceLog = {
            timestamp: new Date().toISOString(),
            type: 'PERFORMANCE_WARNING',
            method: req.method,
            url: req.url,
            duration: `${duration}ms`,
            threshold: `${thresholdMs}ms`,
            statusCode: res.statusCode
          };

          console.warn(JSON.stringify(performanceLog));
        }
      });

      next();
    };
  };

  /**
   * Error logging middleware
   */
  static errorLogger = (err: Error, req: Request, res: Response, next: NextFunction): void => {
    const errorLog = {
      timestamp: new Date().toISOString(),
      type: 'ERROR',
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.url,
      ip: LoggingMiddleware.getClientIP(req),
      userAgent: req.get('User-Agent'),
      correlationId: (req as any).correlationId
    };

    console.error(JSON.stringify(errorLog));
    next(err);
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
  }

  /**
   * Generate correlation ID for request tracking
   */
  private static generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitize headers for logging
   */
  private static sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
      'set-cookie'
    ];

    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Sanitize request body for logging
   */
  private static sanitizeBody(body: any, maxLength: number): any {
    if (!body) return body;

    let sanitized = { ...body };

    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'passwordConfirm',
      'currentPassword',
      'newPassword',
      'token',
      'accessToken',
      'refreshToken',
      'apiKey',
      'secret'
    ];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    // Truncate if too long
    const bodyString = JSON.stringify(sanitized);
    if (bodyString.length > maxLength) {
      return bodyString.substring(0, maxLength) + '... [TRUNCATED]';
    }

    return sanitized;
  }

  /**
   * Health check logging (minimal logging for health endpoints)
   */
  static healthCheckLogger = (req: Request, res: Response, next: NextFunction): void => {
    if (req.path === '/health' || req.path === '/ping') {
      // Minimal logging for health checks
      console.log(`${new Date().toISOString()} - HEALTH_CHECK - ${req.method} ${req.path}`);
    }
    next();
  };
}