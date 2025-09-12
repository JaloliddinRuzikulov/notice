/**
 * Broadcast Routes
 * Defines routes for broadcast management endpoints
 */

import { body, param, query } from 'express-validator';
import { container } from 'tsyringe';
import { BaseRouter } from '../base/BaseRouter';
import { BroadcastController } from '@/presentation/controllers/broadcast/BroadcastController';
import { ErrorHandlerMiddleware } from '@/presentation/middlewares/ErrorHandlerMiddleware';
import { RateLimitMiddleware } from '@/presentation/middlewares/RateLimitMiddleware';
import { BroadcastType, BroadcastStatus } from '@/core/domain/entities/Broadcast';

export class BroadcastRoutes extends BaseRouter {
  private broadcastController: BroadcastController;

  constructor() {
    super();
    this.broadcastController = container.resolve(BroadcastController);
  }

  protected setupRoutes(): void {
    /**
     * @route GET /api/broadcasts
     * @desc Get list of broadcasts with search and pagination
     * @access Private
     */
    this.router.get(
      '/',
      ...this.apiEndpoint(),
      this.validatePagination(),
      this.validateDateRange('startDate', 'endDate'),
      this.validate([
        query('type')
          .optional()
          .isIn(Object.values(BroadcastType))
          .withMessage('Invalid broadcast type'),
        query('status')
          .optional()
          .isIn(Object.values(BroadcastStatus))
          .withMessage('Invalid broadcast status'),
        query('name')
          .optional()
          .trim()
          .isLength({ min: 2 })
          .withMessage('Name search must be at least 2 characters')
      ]),
      ErrorHandlerMiddleware.asyncHandler(this.broadcastController.getBroadcasts.bind(this.broadcastController))
    );

    /**
     * @route GET /api/broadcasts/active
     * @desc Get active broadcasts
     * @access Private
     */
    this.router.get(
      '/active',
      ...this.apiEndpoint(),
      this.validatePagination(),
      ErrorHandlerMiddleware.asyncHandler(this.broadcastController.getActiveBroadcasts.bind(this.broadcastController))
    );

    /**
     * @route GET /api/broadcasts/my
     * @desc Get current user's broadcasts
     * @access Private
     */
    this.router.get(
      '/my',
      ...this.apiEndpoint(),
      this.validatePagination(),
      ErrorHandlerMiddleware.asyncHandler(this.broadcastController.getUserBroadcasts.bind(this.broadcastController))
    );

    /**
     * @route GET /api/broadcasts/:id
     * @desc Get broadcast by ID
     * @access Private
     */
    this.router.get(
      '/:id',
      ...this.apiEndpoint(),
      this.validateUUID('id'),
      ErrorHandlerMiddleware.asyncHandler(this.broadcastController.getBroadcastById.bind(this.broadcastController))
    );

    /**
     * @route GET /api/broadcasts/:id/status
     * @desc Get broadcast status and progress
     * @access Private
     */
    this.router.get(
      '/:id/status',
      ...this.apiEndpoint(),
      this.validateUUID('id'),
      ErrorHandlerMiddleware.asyncHandler(this.broadcastController.getBroadcastStatus.bind(this.broadcastController))
    );

    /**
     * @route POST /api/broadcasts
     * @desc Create and start new broadcast
     * @access Private - requires broadcast:create permission
     */
    this.router.post(
      '/',
      RateLimitMiddleware.broadcastRateLimit,
      ...this.apiEndpoint(),
      this.requirePermissions(['broadcast:create', 'broadcast:manage']),
      this.validate([
        body('name')
          .trim()
          .isLength({ min: 3, max: 100 })
          .withMessage('Broadcast name must be between 3 and 100 characters'),
        body('type')
          .isIn(Object.values(BroadcastType))
          .withMessage('Invalid broadcast type'),
        body('audioFileId')
          .optional()
          .isUUID()
          .withMessage('Audio file ID must be a valid UUID'),
        body('message')
          .optional()
          .trim()
          .isLength({ max: 1000 })
          .withMessage('Message must not exceed 1000 characters'),
        body('targetEmployees')
          .optional()
          .isArray()
          .withMessage('Target employees must be an array')
          .custom((arr) => {
            if (arr && arr.length > 0) {
              return arr.every((id: string) => typeof id === 'string' && id.length > 0);
            }
            return true;
          })
          .withMessage('Target employees must be array of valid IDs'),
        body('targetDepartments')
          .optional()
          .isArray()
          .withMessage('Target departments must be an array'),
        body('targetDistricts')
          .optional()
          .isArray()
          .withMessage('Target districts must be an array'),
        body('scheduledFor')
          .optional()
          .isISO8601()
          .withMessage('Scheduled time must be a valid ISO 8601 date')
          .custom((value) => {
            if (value && new Date(value) < new Date()) {
              throw new Error('Scheduled time cannot be in the past');
            }
            return true;
          })
      ]),
      ErrorHandlerMiddleware.asyncHandler(this.broadcastController.startBroadcast.bind(this.broadcastController))
    );

    /**
     * @route POST /api/broadcasts/:id/stop
     * @desc Stop active broadcast
     * @access Private - requires broadcast:stop permission
     */
    this.router.post(
      '/:id/stop',
      ...this.apiEndpoint(),
      this.requirePermissions(['broadcast:stop', 'broadcast:manage']),
      this.validateUUID('id'),
      this.validate([
        body('reason')
          .optional()
          .trim()
          .isLength({ max: 500 })
          .withMessage('Reason must not exceed 500 characters')
      ]),
      ErrorHandlerMiddleware.asyncHandler(this.broadcastController.stopBroadcast.bind(this.broadcastController))
    );

    /**
     * @route GET /api/broadcasts/search
     * @desc Search broadcasts with advanced filters
     * @access Private
     */
    this.router.get(
      '/search',
      ...this.apiEndpoint(),
      this.validatePagination(),
      this.validateDateRange('startDate', 'endDate'),
      this.validate([
        query('name')
          .optional()
          .trim()
          .isLength({ min: 2 })
          .withMessage('Name search must be at least 2 characters'),
        query('type')
          .optional()
          .isIn(Object.values(BroadcastType))
          .withMessage('Invalid broadcast type'),
        query('status')
          .optional()
          .isIn(Object.values(BroadcastStatus))
          .withMessage('Invalid broadcast status'),
        query('createdBy')
          .optional()
          .isUUID()
          .withMessage('CreatedBy must be a valid UUID')
      ]),
      ErrorHandlerMiddleware.asyncHandler(this.broadcastController.getBroadcasts.bind(this.broadcastController))
    );

    /**
     * @route GET /api/broadcasts/statistics
     * @desc Get broadcast statistics
     * @access Private - requires broadcast:view permission
     */
    this.router.get(
      '/statistics',
      ...this.apiEndpoint(),
      this.requirePermissions(['broadcast:view', 'broadcast:manage']),
      this.validateDateRange('startDate', 'endDate'),
      // This would use a separate statistics use case (not implemented in this example)
      (req, res) => {
        res.status(501).json({
          success: false,
          error: 'Broadcast statistics not implemented yet'
        });
      }
    );

    /**
     * @route GET /api/broadcasts/types
     * @desc Get available broadcast types
     * @access Private
     */
    this.router.get(
      '/types',
      ...this.authenticatedEndpoint(),
      (req, res) => {
        res.json({
          success: true,
          data: {
            types: Object.values(BroadcastType).map(type => ({
              value: type,
              label: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
            }))
          }
        });
      }
    );

    /**
     * @route GET /api/broadcasts/statuses
     * @desc Get available broadcast statuses
     * @access Private
     */
    this.router.get(
      '/statuses',
      ...this.authenticatedEndpoint(),
      (req, res) => {
        res.json({
          success: true,
          data: {
            statuses: Object.values(BroadcastStatus).map(status => ({
              value: status,
              label: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
            }))
          }
        });
      }
    );
  }
}