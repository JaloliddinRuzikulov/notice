"use strict";
/**
 * Base Controller
 * Provides common functionality for all controllers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseController = void 0;
class BaseController {
    success(res, data, message) {
        const response = {
            success: true,
            data,
            message
        };
        return res.status(200).json(response);
    }
    created(res, data, message) {
        const response = {
            success: true,
            data,
            message: message || 'Resource created successfully'
        };
        return res.status(201).json(response);
    }
    noContent(res, message) {
        const response = {
            success: true,
            data: null,
            message: message || 'Operation completed successfully'
        };
        return res.status(200).json(response);
    }
    badRequest(res, message, errors) {
        const response = {
            success: false,
            data: null,
            error: message,
            errors
        };
        return res.status(400).json(response);
    }
    unauthorized(res, message = 'Unauthorized') {
        const response = {
            success: false,
            data: null,
            error: message
        };
        return res.status(401).json(response);
    }
    forbidden(res, message = 'Forbidden') {
        const response = {
            success: false,
            data: null,
            error: message
        };
        return res.status(403).json(response);
    }
    notFound(res, message = 'Resource not found') {
        const response = {
            success: false,
            data: null,
            error: message
        };
        return res.status(404).json(response);
    }
    conflict(res, message) {
        const response = {
            success: false,
            data: null,
            error: message
        };
        return res.status(409).json(response);
    }
    internalError(res, message = 'Internal server error') {
        const response = {
            success: false,
            data: null,
            error: message
        };
        return res.status(500).json(response);
    }
    paginated(res, data, pagination, message) {
        const response = {
            success: true,
            data: {
                data,
                pagination
            },
            message
        };
        return res.status(200).json(response);
    }
    handleUseCaseResult(res, result, successMessage, successStatusCode = 200) {
        if (result.success && result.data) {
            const response = {
                success: true,
                data: result.data,
                message: successMessage
            };
            return res.status(successStatusCode).json(response);
        }
        else {
            const response = {
                success: false,
                data: null,
                error: result.error,
                errors: result.errors
            };
            // Determine appropriate status code based on error message
            const statusCode = this.getStatusCodeFromError(result.error || '');
            return res.status(statusCode).json(response);
        }
    }
    getPaginationFromQuery(req) {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        const sortBy = req.query.sortBy;
        const sortOrder = req.query.sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        return {
            page,
            limit,
            ...(sortBy && { sortBy }),
            sortOrder
        };
    }
    getUserFromRequest(req) {
        // This would be populated by authentication middleware
        return req.user || {
            id: '',
            username: '',
            role: '',
            permissions: []
        };
    }
    getIPAddress(req) {
        return req.ip ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection?.socket?.remoteAddress ||
            '0.0.0.0';
    }
    getStatusCodeFromError(error) {
        const lowerError = error.toLowerCase();
        if (lowerError.includes('not found'))
            return 404;
        if (lowerError.includes('unauthorized') || lowerError.includes('invalid credentials'))
            return 401;
        if (lowerError.includes('forbidden') || lowerError.includes('permission'))
            return 403;
        if (lowerError.includes('already exists') || lowerError.includes('duplicate'))
            return 409;
        if (lowerError.includes('validation') || lowerError.includes('invalid') || lowerError.includes('required'))
            return 400;
        return 500; // Internal server error as default
    }
    validateRequestBody(req, requiredFields) {
        const errors = [];
        const body = req.body;
        for (const field of requiredFields) {
            if (!body[field]) {
                errors.push(`${field} is required`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    sanitizeInput(input) {
        if (typeof input === 'string') {
            return input.trim();
        }
        if (Array.isArray(input)) {
            return input.map(item => this.sanitizeInput(item));
        }
        if (typeof input === 'object' && input !== null) {
            const sanitized = {};
            for (const [key, value] of Object.entries(input)) {
                sanitized[key] = this.sanitizeInput(value);
            }
            return sanitized;
        }
        return input;
    }
}
exports.BaseController = BaseController;
//# sourceMappingURL=BaseController.js.map