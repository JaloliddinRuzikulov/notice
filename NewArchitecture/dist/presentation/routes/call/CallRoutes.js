"use strict";
/**
 * Call Routes
 * Defines routes for call history and management endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallRoutes = void 0;
const express_validator_1 = require("express-validator");
const tsyringe_1 = require("tsyringe");
const BaseRouter_1 = require("../base/BaseRouter");
const CallController_1 = require("@/presentation/controllers/call/CallController");
const ErrorHandlerMiddleware_1 = require("@/presentation/middlewares/ErrorHandlerMiddleware");
const Call_1 = require("@/core/domain/entities/Call");
class CallRoutes extends BaseRouter_1.BaseRouter {
    callController;
    constructor() {
        super();
        this.callController = tsyringe_1.container.resolve(CallController_1.CallController);
    }
    setupRoutes() {
        /**
         * @route GET /api/calls
         * @desc Get call history with search and pagination
         * @access Private
         */
        this.router.get('/', ...this.apiEndpoint(), this.validatePagination(), this.validateDateRange('startDate', 'endDate'), this.validate([
            (0, express_validator_1.query)('employeeName')
                .optional()
                .trim()
                .isLength({ min: 2 })
                .withMessage('Employee name search must be at least 2 characters'),
            (0, express_validator_1.query)('phoneNumber')
                .optional()
                .matches(/^(\+998|998)?[0-9]{9}$/)
                .withMessage('Invalid phone number format'),
            (0, express_validator_1.query)('status')
                .optional()
                .isIn(Object.values(Call_1.CallStatus))
                .withMessage('Invalid call status'),
            (0, express_validator_1.query)('minDuration')
                .optional()
                .isInt({ min: 0 })
                .withMessage('Minimum duration must be a non-negative integer'),
            (0, express_validator_1.query)('maxDuration')
                .optional()
                .isInt({ min: 0 })
                .withMessage('Maximum duration must be a non-negative integer')
                .custom((value, { req }) => {
                const minDuration = parseInt(req.query.minDuration);
                if (minDuration && parseInt(value) < minDuration) {
                    throw new Error('Maximum duration cannot be less than minimum duration');
                }
                return true;
            })
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.callController.getCallHistory.bind(this.callController)));
        /**
         * @route GET /api/calls/:id
         * @desc Get call record by ID
         * @access Private
         */
        this.router.get('/:id', ...this.apiEndpoint(), this.validateUUID('id'), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.callController.getCallById.bind(this.callController)));
        /**
         * @route POST /api/calls
         * @desc Create call record
         * @access Private - requires call:create permission
         */
        this.router.post('/', ...this.apiEndpoint(), this.requirePermissions(['call:create', 'call:manage']), this.validate([
            (0, express_validator_1.body)('employeeId')
                .isUUID()
                .withMessage('Employee ID must be a valid UUID'),
            (0, express_validator_1.body)('phoneNumber')
                .matches(/^(\+998|998)?[0-9]{9}$/)
                .withMessage('Invalid phone number format'),
            (0, express_validator_1.body)('broadcastId')
                .optional()
                .isUUID()
                .withMessage('Broadcast ID must be a valid UUID'),
            (0, express_validator_1.body)('startTime')
                .isISO8601()
                .withMessage('Start time must be a valid ISO 8601 date'),
            (0, express_validator_1.body)('endTime')
                .optional()
                .isISO8601()
                .withMessage('End time must be a valid ISO 8601 date')
                .custom((value, { req }) => {
                if (value && req.body.startTime && new Date(value) < new Date(req.body.startTime)) {
                    throw new Error('End time cannot be before start time');
                }
                return true;
            }),
            (0, express_validator_1.body)('status')
                .isIn(Object.values(Call_1.CallStatus))
                .withMessage('Invalid call status'),
            (0, express_validator_1.body)('duration')
                .optional()
                .isInt({ min: 0 })
                .withMessage('Duration must be a non-negative integer'),
            (0, express_validator_1.body)('callerId')
                .optional()
                .trim()
                .isLength({ max: 100 })
                .withMessage('Caller ID must not exceed 100 characters'),
            (0, express_validator_1.body)('notes')
                .optional()
                .trim()
                .isLength({ max: 500 })
                .withMessage('Notes must not exceed 500 characters')
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.callController.createCallRecord.bind(this.callController)));
        /**
         * @route PUT /api/calls/:id/status
         * @desc Update call status
         * @access Private - requires call:update permission
         */
        this.router.put('/:id/status', ...this.apiEndpoint(), this.requirePermissions(['call:update', 'call:manage']), this.validateUUID('id'), this.validate([
            (0, express_validator_1.body)('status')
                .isIn(Object.values(Call_1.CallStatus))
                .withMessage('Invalid call status'),
            (0, express_validator_1.body)('endTime')
                .optional()
                .isISO8601()
                .withMessage('End time must be a valid ISO 8601 date'),
            (0, express_validator_1.body)('duration')
                .optional()
                .isInt({ min: 0 })
                .withMessage('Duration must be a non-negative integer'),
            (0, express_validator_1.body)('notes')
                .optional()
                .trim()
                .isLength({ max: 500 })
                .withMessage('Notes must not exceed 500 characters')
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.callController.updateCallStatus.bind(this.callController)));
        /**
         * @route GET /api/calls/employee/:employeeId
         * @desc Get calls by employee ID
         * @access Private
         */
        this.router.get('/employee/:employeeId', ...this.apiEndpoint(), this.validateUUID('employeeId'), this.validatePagination(), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.callController.getCallsByEmployee.bind(this.callController)));
        /**
         * @route GET /api/calls/broadcast/:broadcastId
         * @desc Get calls by broadcast ID
         * @access Private
         */
        this.router.get('/broadcast/:broadcastId', ...this.apiEndpoint(), this.validateUUID('broadcastId'), this.validatePagination(), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.callController.getCallsByBroadcast.bind(this.callController)));
        /**
         * @route GET /api/calls/statistics
         * @desc Get call statistics
         * @access Private - requires call:view permission
         */
        this.router.get('/statistics', ...this.apiEndpoint(), this.requirePermissions(['call:view', 'call:manage']), this.validateDateRange('startDate', 'endDate'), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.callController.getCallStatistics.bind(this.callController)));
        /**
         * @route GET /api/calls/report
         * @desc Get call report with analytics
         * @access Private - requires call:view permission
         */
        this.router.get('/report', ...this.apiEndpoint(), this.requirePermissions(['call:view', 'call:manage']), this.validateDateRange('startDate', 'endDate'), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.callController.getCallReport.bind(this.callController)));
        /**
         * @route GET /api/calls/search
         * @desc Search calls with advanced filters
         * @access Private
         */
        this.router.get('/search', ...this.apiEndpoint(), this.validatePagination(), this.validateDateRange('startDate', 'endDate'), this.validate([
            (0, express_validator_1.query)('employeeName')
                .optional()
                .trim()
                .isLength({ min: 2 })
                .withMessage('Employee name search must be at least 2 characters'),
            (0, express_validator_1.query)('phoneNumber')
                .optional()
                .matches(/^(\+998|998)?[0-9]{9}$/)
                .withMessage('Invalid phone number format'),
            (0, express_validator_1.query)('status')
                .optional()
                .isIn(Object.values(Call_1.CallStatus))
                .withMessage('Invalid call status'),
            (0, express_validator_1.query)('broadcastId')
                .optional()
                .isUUID()
                .withMessage('Broadcast ID must be a valid UUID')
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.callController.getCallHistory.bind(this.callController)));
        /**
         * @route GET /api/calls/statuses
         * @desc Get available call statuses
         * @access Private
         */
        this.router.get('/statuses', ...this.authenticatedEndpoint(), (req, res) => {
            res.json({
                success: true,
                data: {
                    statuses: Object.values(Call_1.CallStatus).map(status => ({
                        value: status,
                        label: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace(/_/g, ' ')
                    }))
                }
            });
        });
    }
}
exports.CallRoutes = CallRoutes;
//# sourceMappingURL=CallRoutes.js.map