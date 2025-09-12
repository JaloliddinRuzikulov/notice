/**
 * Error Handler Middleware
 * Centralized error handling for the application
 */

import { Request, Response, NextFunction } from 'express';
import { injectable } from 'tsyringe';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  errors?: string[];
}

@injectable()
export class ErrorHandlerMiddleware {
  /**
   * Global error handler
   */
  static handleError = (err: AppError, req: Request, res: Response, next: NextFunction): void => {
    // Log error
    console.error('Error occurred:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    // Set default error values
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errors = err.errors || [];

    // Handle specific error types
    if (err.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation Error';
      errors = ErrorHandlerMiddleware.extractValidationErrors(err);
    }

    if (err.name === 'CastError') {
      statusCode = 400;
      message = 'Invalid data format';
    }

    if (err.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Token expired';
    }

    if (err.name === 'MulterError') {
      statusCode = 400;
      message = ErrorHandlerMiddleware.handleMulterError(err);
    }

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
      message = 'Something went wrong';
      errors = [];
    }

    // Send error response
    const response: any = {
      success: false,
      error: message
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      response.stack = err.stack;
    }

    res.status(statusCode).json(response);
  };

  /**
   * Handle 404 errors
   */
  static handleNotFound = (req: Request, res: Response, next: NextFunction): void => {
    res.status(404).json({
      success: false,
      error: `Route ${req.method} ${req.url} not found`
    });
  };

  /**
   * Async error wrapper
   */
  static asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  /**
   * Create operational error
   */
  static createError = (message: string, statusCode: number = 500, errors?: string[]): AppError => {
    const error = new Error(message) as AppError;
    error.statusCode = statusCode;
    error.isOperational = true;
    error.errors = errors;
    return error;
  };

  /**
   * Extract validation errors
   */
  private static extractValidationErrors(err: any): string[] {
    const errors: string[] = [];

    if (err.errors) {
      Object.values(err.errors).forEach((error: any) => {
        errors.push(error.message);
      });
    }

    return errors;
  }

  /**
   * Handle Multer errors
   */
  private static handleMulterError(err: any): string {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return 'File size too large';
      case 'LIMIT_FILE_COUNT':
        return 'Too many files';
      case 'LIMIT_FIELD_KEY':
        return 'Field name too long';
      case 'LIMIT_FIELD_VALUE':
        return 'Field value too long';
      case 'LIMIT_FIELD_COUNT':
        return 'Too many fields';
      case 'LIMIT_UNEXPECTED_FILE':
        return 'Unexpected field';
      case 'MISSING_FIELD_NAME':
        return 'Missing field name';
      default:
        return 'File upload error';
    }
  }

  /**
   * Rate limit error handler
   */
  static handleRateLimit = (req: Request, res: Response): void => {
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter: (req as any).rateLimit?.resetTime
    });
  };

  /**
   * CORS error handler
   */
  static handleCORS = (req: Request, res: Response): void => {
    res.status(403).json({
      success: false,
      error: 'CORS policy violation'
    });
  };

  /**
   * Request timeout handler
   */
  static handleTimeout = (req: Request, res: Response): void => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        error: 'Request timeout'
      });
    }
  };

  /**
   * Graceful shutdown handler
   */
  static gracefulShutdown = (server: any) => {
    return (signal: string) => {
      console.log(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });

      // Force close server after 30 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };
  };

  /**
   * Unhandled promise rejection handler
   */
  static handleUnhandledRejection = (reason: any, promise: Promise<any>): void => {
    console.error('Unhandled Promise Rejection:', {
      reason: reason.message || reason,
      stack: reason.stack,
      promise: promise,
      timestamp: new Date().toISOString()
    });

    // In production, you might want to restart the process
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  };

  /**
   * Uncaught exception handler
   */
  static handleUncaughtException = (error: Error): void => {
    console.error('Uncaught Exception:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Exit the process as the app is in an undefined state
    process.exit(1);
  };
}