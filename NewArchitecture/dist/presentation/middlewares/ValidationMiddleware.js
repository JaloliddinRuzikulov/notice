"use strict";
/**
 * Validation Middleware
 * Provides request validation functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationMiddleware = void 0;
const express_validator_1 = require("express-validator");
class ValidationMiddleware {
    /**
     * Handle validation results
     */
    static handleValidation = (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            const validationErrors = errors.array().map(error => ({
                field: error.type === 'field' ? error.path : 'unknown',
                message: error.msg,
                value: error.type === 'field' ? error.value : undefined
            }));
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                errors: validationErrors.map(err => `${err.field}: ${err.message}`)
            });
            return;
        }
        next();
    };
    /**
     * Run validation chains and handle results
     */
    static validate = (validations) => {
        return async (req, res, next) => {
            // Run all validations
            await Promise.all(validations.map(validation => validation.run(req)));
            // Handle validation results
            ValidationMiddleware.handleValidation(req, res, next);
        };
    };
    /**
     * Sanitize request body
     */
    static sanitizeBody = (req, res, next) => {
        if (req.body && typeof req.body === 'object') {
            req.body = ValidationMiddleware.sanitizeObject(req.body);
        }
        next();
    };
    /**
     * Sanitize query parameters
     */
    static sanitizeQuery = (req, res, next) => {
        if (req.query && typeof req.query === 'object') {
            req.query = ValidationMiddleware.sanitizeObject(req.query);
        }
        next();
    };
    /**
     * Recursively sanitize object properties
     */
    static sanitizeObject(obj) {
        if (typeof obj === 'string') {
            return obj.trim();
        }
        if (Array.isArray(obj)) {
            return obj.map(item => ValidationMiddleware.sanitizeObject(item));
        }
        if (typeof obj === 'object' && obj !== null) {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                sanitized[key] = ValidationMiddleware.sanitizeObject(value);
            }
            return sanitized;
        }
        return obj;
    }
    /**
     * Validate file upload
     */
    static validateFileUpload = (options = {}) => {
        return (req, res, next) => {
            const { required = true, maxSize = 50 * 1024 * 1024, // 50MB default
            allowedMimeTypes = [], allowedExtensions = [] } = options;
            // Check if file is required
            if (required && !req.file) {
                res.status(400).json({
                    success: false,
                    error: 'File upload is required'
                });
                return;
            }
            // If no file and not required, continue
            if (!req.file && !required) {
                next();
                return;
            }
            const file = req.file;
            // Check file size
            if (file.size > maxSize) {
                res.status(400).json({
                    success: false,
                    error: `File size exceeds limit of ${Math.round(maxSize / (1024 * 1024))}MB`
                });
                return;
            }
            // Check MIME type
            if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.mimetype)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`
                });
                return;
            }
            // Check file extension
            if (allowedExtensions.length > 0) {
                const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
                if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
                    res.status(400).json({
                        success: false,
                        error: `Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`
                    });
                    return;
                }
            }
            next();
        };
    };
    /**
     * Validate pagination parameters
     */
    static validatePagination = (req, res, next) => {
        const page = req.query.page;
        const limit = req.query.limit;
        if (page && (isNaN(parseInt(page)) || parseInt(page) < 1)) {
            res.status(400).json({
                success: false,
                error: 'Page must be a positive integer'
            });
            return;
        }
        if (limit && (isNaN(parseInt(limit)) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
            res.status(400).json({
                success: false,
                error: 'Limit must be between 1 and 100'
            });
            return;
        }
        next();
    };
    /**
     * Validate date parameters
     */
    static validateDateRange = (startDateParam = 'startDate', endDateParam = 'endDate') => {
        return (req, res, next) => {
            const startDate = req.query[startDateParam];
            const endDate = req.query[endDateParam];
            if (startDate && isNaN(Date.parse(startDate))) {
                res.status(400).json({
                    success: false,
                    error: `Invalid ${startDateParam} format. Use ISO 8601 format (YYYY-MM-DD)`
                });
                return;
            }
            if (endDate && isNaN(Date.parse(endDate))) {
                res.status(400).json({
                    success: false,
                    error: `Invalid ${endDateParam} format. Use ISO 8601 format (YYYY-MM-DD)`
                });
                return;
            }
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                if (start > end) {
                    res.status(400).json({
                        success: false,
                        error: `${startDateParam} cannot be after ${endDateParam}`
                    });
                    return;
                }
            }
            next();
        };
    };
    /**
     * Validate required parameters
     */
    static requireParams = (params) => {
        return (req, res, next) => {
            const missing = params.filter(param => !req.params[param]);
            if (missing.length > 0) {
                res.status(400).json({
                    success: false,
                    error: `Missing required parameters: ${missing.join(', ')}`
                });
                return;
            }
            next();
        };
    };
    /**
     * Validate UUID format
     */
    static validateUUID = (paramName = 'id') => {
        return (req, res, next) => {
            const uuid = req.params[paramName];
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (uuid && !uuidRegex.test(uuid)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid ${paramName} format. Must be a valid UUID`
                });
                return;
            }
            next();
        };
    };
}
exports.ValidationMiddleware = ValidationMiddleware;
//# sourceMappingURL=ValidationMiddleware.js.map