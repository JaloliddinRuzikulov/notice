"use strict";
/**
 * Error Handler Middleware
 * Centralized error handling for the application
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ErrorHandlerMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandlerMiddleware = void 0;
const tsyringe_1 = require("tsyringe");
let ErrorHandlerMiddleware = class ErrorHandlerMiddleware {
    static { ErrorHandlerMiddleware_1 = this; }
    /**
     * Global error handler
     */
    static handleError = (err, req, res, next) => {
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
            errors = ErrorHandlerMiddleware_1.extractValidationErrors(err);
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
            message = ErrorHandlerMiddleware_1.handleMulterError(err);
        }
        // Don't expose internal errors in production
        if (process.env.NODE_ENV === 'production' && statusCode === 500) {
            message = 'Something went wrong';
            errors = [];
        }
        // Send error response
        const response = {
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
    static handleNotFound = (req, res, next) => {
        res.status(404).json({
            success: false,
            error: `Route ${req.method} ${req.url} not found`
        });
    };
    /**
     * Async error wrapper
     */
    static asyncHandler = (fn) => {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    };
    /**
     * Create operational error
     */
    static createError = (message, statusCode = 500, errors) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        error.isOperational = true;
        error.errors = errors;
        return error;
    };
    /**
     * Extract validation errors
     */
    static extractValidationErrors(err) {
        const errors = [];
        if (err.errors) {
            Object.values(err.errors).forEach((error) => {
                errors.push(error.message);
            });
        }
        return errors;
    }
    /**
     * Handle Multer errors
     */
    static handleMulterError(err) {
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
    static handleRateLimit = (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many requests. Please try again later.',
            retryAfter: req.rateLimit?.resetTime
        });
    };
    /**
     * CORS error handler
     */
    static handleCORS = (req, res) => {
        res.status(403).json({
            success: false,
            error: 'CORS policy violation'
        });
    };
    /**
     * Request timeout handler
     */
    static handleTimeout = (req, res) => {
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
    static gracefulShutdown = (server) => {
        return (signal) => {
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
    static handleUnhandledRejection = (reason, promise) => {
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
    static handleUncaughtException = (error) => {
        console.error('Uncaught Exception:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        // Exit the process as the app is in an undefined state
        process.exit(1);
    };
};
exports.ErrorHandlerMiddleware = ErrorHandlerMiddleware;
exports.ErrorHandlerMiddleware = ErrorHandlerMiddleware = ErrorHandlerMiddleware_1 = __decorate([
    (0, tsyringe_1.injectable)()
], ErrorHandlerMiddleware);
//# sourceMappingURL=ErrorHandlerMiddleware.js.map