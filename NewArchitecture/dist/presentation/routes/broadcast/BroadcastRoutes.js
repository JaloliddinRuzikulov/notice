"use strict";
/**
 * Broadcast Routes
 * Defines routes for broadcast management endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastRoutes = void 0;
const express_validator_1 = require("express-validator");
const tsyringe_1 = require("tsyringe");
const BaseRouter_1 = require("../base/BaseRouter");
const BroadcastController_1 = require("@/presentation/controllers/broadcast/BroadcastController");
const ErrorHandlerMiddleware_1 = require("@/presentation/middlewares/ErrorHandlerMiddleware");
const RateLimitMiddleware_1 = require("@/presentation/middlewares/RateLimitMiddleware");
const Broadcast_1 = require("@/core/domain/entities/Broadcast");
class BroadcastRoutes extends BaseRouter_1.BaseRouter {
    broadcastController;
    constructor() {
        super();
        this.broadcastController = tsyringe_1.container.resolve(BroadcastController_1.BroadcastController);
    }
    setupRoutes() {
        /**
         * @route GET /api/broadcasts
         * @desc Get list of broadcasts with search and pagination
         * @access Private
         */
        this.router.get('/', ...this.apiEndpoint(), this.validatePagination(), this.validateDateRange('startDate', 'endDate'), this.validate([
            (0, express_validator_1.query)('type')
                .optional()
                .isIn(Object.values(Broadcast_1.BroadcastType))
                .withMessage('Invalid broadcast type'),
            (0, express_validator_1.query)('status')
                .optional()
                .isIn(Object.values(Broadcast_1.BroadcastStatus))
                .withMessage('Invalid broadcast status'),
            (0, express_validator_1.query)('name')
                .optional()
                .trim()
                .isLength({ min: 2 })
                .withMessage('Name search must be at least 2 characters')
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.broadcastController.getBroadcasts.bind(this.broadcastController)));
        /**
         * @route GET /api/broadcasts/active
         * @desc Get active broadcasts
         * @access Private
         */
        this.router.get('/active', ...this.apiEndpoint(), this.validatePagination(), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.broadcastController.getActiveBroadcasts.bind(this.broadcastController)));
        /**
         * @route GET /api/broadcasts/my
         * @desc Get current user's broadcasts
         * @access Private
         */
        this.router.get('/my', ...this.apiEndpoint(), this.validatePagination(), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.broadcastController.getUserBroadcasts.bind(this.broadcastController)));
        /**
         * @route GET /api/broadcasts/:id
         * @desc Get broadcast by ID
         * @access Private
         */
        this.router.get('/:id', ...this.apiEndpoint(), this.validateUUID('id'), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.broadcastController.getBroadcastById.bind(this.broadcastController)));
        /**
         * @route GET /api/broadcasts/:id/status
         * @desc Get broadcast status and progress
         * @access Private
         */
        this.router.get('/:id/status', ...this.apiEndpoint(), this.validateUUID('id'), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.broadcastController.getBroadcastStatus.bind(this.broadcastController)));
        /**
         * @route POST /api/broadcasts
         * @desc Create and start new broadcast
         * @access Private - requires broadcast:create permission
         */
        this.router.post('/', RateLimitMiddleware_1.RateLimitMiddleware.broadcastRateLimit, ...this.apiEndpoint(), this.requirePermissions(['broadcast:create', 'broadcast:manage']), this.validate([
            (0, express_validator_1.body)('name')
                .trim()
                .isLength({ min: 3, max: 100 })
                .withMessage('Broadcast name must be between 3 and 100 characters'),
            (0, express_validator_1.body)('type')
                .isIn(Object.values(Broadcast_1.BroadcastType))
                .withMessage('Invalid broadcast type'),
            (0, express_validator_1.body)('audioFileId')
                .optional()
                .isUUID()
                .withMessage('Audio file ID must be a valid UUID'),
            (0, express_validator_1.body)('message')
                .optional()
                .trim()
                .isLength({ max: 1000 })
                .withMessage('Message must not exceed 1000 characters'),
            (0, express_validator_1.body)('targetEmployees')
                .optional()
                .isArray()
                .withMessage('Target employees must be an array')
                .custom((arr) => {
                if (arr && arr.length > 0) {
                    return arr.every((id) => typeof id === 'string' && id.length > 0);
                }
                return true;
            })
                .withMessage('Target employees must be array of valid IDs'),
            (0, express_validator_1.body)('targetDepartments')
                .optional()
                .isArray()
                .withMessage('Target departments must be an array'),
            (0, express_validator_1.body)('targetDistricts')
                .optional()
                .isArray()
                .withMessage('Target districts must be an array'),
            (0, express_validator_1.body)('scheduledFor')
                .optional()
                .isISO8601()
                .withMessage('Scheduled time must be a valid ISO 8601 date')
                .custom((value) => {
                if (value && new Date(value) < new Date()) {
                    throw new Error('Scheduled time cannot be in the past');
                }
                return true;
            })
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.broadcastController.startBroadcast.bind(this.broadcastController)));
        /**
         * @route POST /api/broadcasts/:id/stop
         * @desc Stop active broadcast
         * @access Private - requires broadcast:stop permission
         */
        this.router.post('/:id/stop', ...this.apiEndpoint(), this.requirePermissions(['broadcast:stop', 'broadcast:manage']), this.validateUUID('id'), this.validate([
            (0, express_validator_1.body)('reason')
                .optional()
                .trim()
                .isLength({ max: 500 })
                .withMessage('Reason must not exceed 500 characters')
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.broadcastController.stopBroadcast.bind(this.broadcastController)));
        /**
         * @route GET /api/broadcasts/search
         * @desc Search broadcasts with advanced filters
         * @access Private
         */
        this.router.get('/search', ...this.apiEndpoint(), this.validatePagination(), this.validateDateRange('startDate', 'endDate'), this.validate([
            (0, express_validator_1.query)('name')
                .optional()
                .trim()
                .isLength({ min: 2 })
                .withMessage('Name search must be at least 2 characters'),
            (0, express_validator_1.query)('type')
                .optional()
                .isIn(Object.values(Broadcast_1.BroadcastType))
                .withMessage('Invalid broadcast type'),
            (0, express_validator_1.query)('status')
                .optional()
                .isIn(Object.values(Broadcast_1.BroadcastStatus))
                .withMessage('Invalid broadcast status'),
            (0, express_validator_1.query)('createdBy')
                .optional()
                .isUUID()
                .withMessage('CreatedBy must be a valid UUID')
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.broadcastController.getBroadcasts.bind(this.broadcastController)));
        /**
         * @route GET /api/broadcasts/statistics
         * @desc Get broadcast statistics
         * @access Private - requires broadcast:view permission
         */
        this.router.get('/statistics', ...this.apiEndpoint(), this.requirePermissions(['broadcast:view', 'broadcast:manage']), this.validateDateRange('startDate', 'endDate'), 
        // This would use a separate statistics use case (not implemented in this example)
        (req, res) => {
            res.status(501).json({
                success: false,
                error: 'Broadcast statistics not implemented yet'
            });
        });
        /**
         * @route GET /api/broadcasts/types
         * @desc Get available broadcast types
         * @access Private
         */
        this.router.get('/types', ...this.authenticatedEndpoint(), (req, res) => {
            res.json({
                success: true,
                data: {
                    types: Object.values(Broadcast_1.BroadcastType).map(type => ({
                        value: type,
                        label: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
                    }))
                }
            });
        });
        /**
         * @route GET /api/broadcasts/statuses
         * @desc Get available broadcast statuses
         * @access Private
         */
        this.router.get('/statuses', ...this.authenticatedEndpoint(), (req, res) => {
            res.json({
                success: true,
                data: {
                    statuses: Object.values(Broadcast_1.BroadcastStatus).map(status => ({
                        value: status,
                        label: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
                    }))
                }
            });
        });
    }
}
exports.BroadcastRoutes = BroadcastRoutes;
//# sourceMappingURL=BroadcastRoutes.js.map