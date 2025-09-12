"use strict";
/**
 * Base Router
 * Provides common routing functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRouter = void 0;
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const AuthMiddleware_1 = require("@/presentation/middlewares/AuthMiddleware");
const ValidationMiddleware_1 = require("@/presentation/middlewares/ValidationMiddleware");
const RateLimitMiddleware_1 = require("@/presentation/middlewares/RateLimitMiddleware");
class BaseRouter {
    router;
    authMiddleware;
    constructor() {
        this.router = (0, express_1.Router)();
        this.authMiddleware = tsyringe_1.container.resolve(AuthMiddleware_1.AuthMiddleware);
        this.setupRoutes();
    }
    getRouter() {
        return this.router;
    }
    /**
     * Apply authentication middleware
     */
    requireAuth() {
        return this.authMiddleware.authenticate;
    }
    /**
     * Apply authorization middleware
     */
    requirePermissions(permissions) {
        return this.authMiddleware.authorize(permissions);
    }
    /**
     * Apply role-based authorization
     */
    requireRole(roles) {
        return this.authMiddleware.requireRole(roles);
    }
    /**
     * Apply optional authentication
     */
    optionalAuth() {
        return this.authMiddleware.optionalAuth;
    }
    /**
     * Apply validation middleware
     */
    validate(validations) {
        return ValidationMiddleware_1.ValidationMiddleware.validate(validations);
    }
    /**
     * Apply rate limiting
     */
    rateLimit(options) {
        return RateLimitMiddleware_1.RateLimitMiddleware.createRateLimit(options);
    }
    /**
     * Apply pagination validation
     */
    validatePagination() {
        return ValidationMiddleware_1.ValidationMiddleware.validatePagination;
    }
    /**
     * Apply date range validation
     */
    validateDateRange(startParam, endParam) {
        return ValidationMiddleware_1.ValidationMiddleware.validateDateRange(startParam, endParam);
    }
    /**
     * Apply UUID validation
     */
    validateUUID(paramName) {
        return ValidationMiddleware_1.ValidationMiddleware.validateUUID(paramName);
    }
    /**
     * Apply required parameters validation
     */
    requireParams(params) {
        return ValidationMiddleware_1.ValidationMiddleware.requireParams(params);
    }
    /**
     * Apply file upload validation
     */
    validateFileUpload(options) {
        return ValidationMiddleware_1.ValidationMiddleware.validateFileUpload(options);
    }
    /**
     * Common middleware stack for authenticated endpoints
     */
    authenticatedEndpoint() {
        return [
            this.requireAuth(),
            ValidationMiddleware_1.ValidationMiddleware.sanitizeBody,
            ValidationMiddleware_1.ValidationMiddleware.sanitizeQuery
        ];
    }
    /**
     * Common middleware stack for public endpoints
     */
    publicEndpoint() {
        return [
            ValidationMiddleware_1.ValidationMiddleware.sanitizeBody,
            ValidationMiddleware_1.ValidationMiddleware.sanitizeQuery
        ];
    }
    /**
     * Common middleware stack for admin endpoints
     */
    adminEndpoint() {
        return [
            this.requireAuth(),
            this.requireRole('admin'),
            ValidationMiddleware_1.ValidationMiddleware.sanitizeBody,
            ValidationMiddleware_1.ValidationMiddleware.sanitizeQuery
        ];
    }
    /**
     * Common middleware stack for API endpoints with rate limiting
     */
    apiEndpoint() {
        return [
            RateLimitMiddleware_1.RateLimitMiddleware.apiRateLimit,
            this.requireAuth(),
            ValidationMiddleware_1.ValidationMiddleware.sanitizeBody,
            ValidationMiddleware_1.ValidationMiddleware.sanitizeQuery
        ];
    }
}
exports.BaseRouter = BaseRouter;
//# sourceMappingURL=BaseRouter.js.map