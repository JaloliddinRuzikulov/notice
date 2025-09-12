/**
 * Base Router
 * Provides common routing functionality
 */

import { Router } from 'express';
import { container } from 'tsyringe';
import { AuthMiddleware } from '@/presentation/middlewares/AuthMiddleware';
import { ValidationMiddleware } from '@/presentation/middlewares/ValidationMiddleware';
import { RateLimitMiddleware } from '@/presentation/middlewares/RateLimitMiddleware';

export abstract class BaseRouter {
  protected router: Router;
  protected authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.authMiddleware = container.resolve(AuthMiddleware);
    // Don't call setupRoutes() here - child constructor will call it after initialization
  }

  protected initialize(): void {
    this.setupRoutes();
  }

  protected abstract setupRoutes(): void;

  public getRouter(): Router {
    return this.router;
  }

  /**
   * Apply authentication middleware
   */
  protected requireAuth() {
    return this.authMiddleware.authenticate;
  }

  /**
   * Apply authorization middleware
   */
  protected requirePermissions(permissions: string | string[]) {
    return this.authMiddleware.authorize(permissions);
  }

  /**
   * Apply role-based authorization
   */
  protected requireRole(roles: string | string[]) {
    return this.authMiddleware.requireRole(roles);
  }

  /**
   * Apply optional authentication
   */
  protected optionalAuth() {
    return this.authMiddleware.optionalAuth;
  }

  /**
   * Apply validation middleware
   */
  protected validate(validations: any[]) {
    return ValidationMiddleware.validate(validations);
  }

  /**
   * Apply rate limiting
   */
  protected rateLimit(options: any) {
    return RateLimitMiddleware.createRateLimit(options);
  }

  /**
   * Apply pagination validation
   */
  protected validatePagination() {
    return ValidationMiddleware.validatePagination;
  }

  /**
   * Apply date range validation
   */
  protected validateDateRange(startParam?: string, endParam?: string) {
    return ValidationMiddleware.validateDateRange(startParam, endParam);
  }

  /**
   * Apply UUID validation
   */
  protected validateUUID(paramName?: string) {
    return ValidationMiddleware.validateUUID(paramName);
  }

  /**
   * Apply required parameters validation
   */
  protected requireParams(params: string[]) {
    return ValidationMiddleware.requireParams(params);
  }

  /**
   * Apply file upload validation
   */
  protected validateFileUpload(options?: any) {
    return ValidationMiddleware.validateFileUpload(options);
  }

  /**
   * Common middleware stack for authenticated endpoints
   */
  protected authenticatedEndpoint() {
    return [
      this.requireAuth(),
      ValidationMiddleware.sanitizeBody,
      ValidationMiddleware.sanitizeQuery
    ];
  }

  /**
   * Common middleware stack for public endpoints
   */
  protected publicEndpoint() {
    return [
      ValidationMiddleware.sanitizeBody,
      ValidationMiddleware.sanitizeQuery
    ];
  }

  /**
   * Common middleware stack for admin endpoints
   */
  protected adminEndpoint() {
    return [
      this.requireAuth(),
      this.requireRole('admin'),
      ValidationMiddleware.sanitizeBody,
      ValidationMiddleware.sanitizeQuery
    ];
  }

  /**
   * Common middleware stack for API endpoints with rate limiting
   */
  protected apiEndpoint() {
    return [
      RateLimitMiddleware.apiRateLimit,
      this.requireAuth(),
      ValidationMiddleware.sanitizeBody,
      ValidationMiddleware.sanitizeQuery
    ];
  }
}