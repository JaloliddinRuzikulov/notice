"use strict";
/**
 * Call Controller
 * Handles HTTP requests for call history and management
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallController = void 0;
const tsyringe_1 = require("tsyringe");
const BaseController_1 = require("../base/BaseController");
const CreateCallRecordUseCase_1 = require("@/application/usecases/call/CreateCallRecordUseCase");
const GetCallHistoryUseCase_1 = require("@/application/usecases/call/GetCallHistoryUseCase");
const UpdateCallStatusUseCase_1 = require("@/application/usecases/call/UpdateCallStatusUseCase");
const CallMapper_1 = require("@/application/mappers/call/CallMapper");
const Call_1 = require("@/core/domain/entities/Call");
let CallController = class CallController extends BaseController_1.BaseController {
    createCallRecordUseCase;
    getCallHistoryUseCase;
    updateCallStatusUseCase;
    callMapper;
    constructor(createCallRecordUseCase, getCallHistoryUseCase, updateCallStatusUseCase, callMapper) {
        super();
        this.createCallRecordUseCase = createCallRecordUseCase;
        this.getCallHistoryUseCase = getCallHistoryUseCase;
        this.updateCallStatusUseCase = updateCallStatusUseCase;
        this.callMapper = callMapper;
    }
    /**
     * Create call record
     * POST /api/calls
     */
    async createCallRecord(req, res) {
        try {
            const validation = this.validateRequestBody(req, [
                'employeeId', 'phoneNumber', 'startTime', 'status'
            ]);
            if (!validation.isValid) {
                return this.badRequest(res, 'Validation failed', validation.errors);
            }
            // Validate call status
            if (!Object.values(Call_1.CallStatus).includes(req.body.status)) {
                return this.badRequest(res, 'Invalid call status');
            }
            const createDTO = this.sanitizeInput({
                employeeId: req.body.employeeId,
                phoneNumber: req.body.phoneNumber,
                broadcastId: req.body.broadcastId,
                startTime: new Date(req.body.startTime),
                endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
                status: req.body.status,
                duration: req.body.duration,
                callerId: req.body.callerId,
                notes: req.body.notes
            });
            const result = await this.createCallRecordUseCase.execute(createDTO);
            if (result.success && result.data) {
                const callDTO = this.callMapper.toDTO(result.data.call);
                return this.created(res, callDTO, 'Call record created successfully');
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error creating call record:', error);
            return this.internalError(res, 'Failed to create call record');
        }
    }
    /**
     * Get call history with search and pagination
     * GET /api/calls
     */
    async getCallHistory(req, res) {
        try {
            const pagination = this.getPaginationFromQuery(req);
            const search = {
                employeeId: req.query.employeeId,
                employeeName: req.query.employeeName,
                phoneNumber: req.query.phoneNumber,
                broadcastId: req.query.broadcastId,
                status: req.query.status,
                minDuration: req.query.minDuration ? parseInt(req.query.minDuration) : undefined,
                maxDuration: req.query.maxDuration ? parseInt(req.query.maxDuration) : undefined
            };
            // Handle date range
            if (req.query.startDate && req.query.endDate) {
                search.dateRange = {
                    startDate: new Date(req.query.startDate),
                    endDate: new Date(req.query.endDate)
                };
            }
            // Remove undefined values
            Object.keys(search).forEach(key => search[key] === undefined && delete search[key]);
            const result = await this.getCallHistoryUseCase.execute({
                search: Object.keys(search).length > 0 ? search : undefined,
                pagination
            });
            if (result.success && result.data) {
                const callDTOs = result.data.calls.map(call => this.callMapper.toDTO(call));
                if (result.data.pagination) {
                    return this.paginated(res, callDTOs, result.data.pagination, undefined);
                }
                else {
                    const response = this.callMapper.toHistoryResponseDTO(result.data.calls, result.data.statistics);
                    return this.success(res, response);
                }
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error getting call history:', error);
            return this.internalError(res, 'Failed to retrieve call history');
        }
    }
    /**
     * Update call status
     * PUT /api/calls/:id/status
     */
    async updateCallStatus(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return this.badRequest(res, 'Call ID is required');
            }
            const validation = this.validateRequestBody(req, ['status']);
            if (!validation.isValid) {
                return this.badRequest(res, 'Validation failed', validation.errors);
            }
            // Validate call status
            if (!Object.values(Call_1.CallStatus).includes(req.body.status)) {
                return this.badRequest(res, 'Invalid call status');
            }
            const updateDTO = this.sanitizeInput({
                status: req.body.status,
                endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
                duration: req.body.duration,
                notes: req.body.notes
            });
            const result = await this.updateCallStatusUseCase.execute({
                callId: id,
                ...updateDTO
            });
            if (result.success && result.data) {
                const callDTO = this.callMapper.toDTO(result.data.call);
                return this.success(res, callDTO, 'Call status updated successfully');
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error updating call status:', error);
            return this.internalError(res, 'Failed to update call status');
        }
    }
    /**
     * Get call by ID
     * GET /api/calls/:id
     */
    async getCallById(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return this.badRequest(res, 'Call ID is required');
            }
            // This would use a GetCallByIdUseCase (not implemented in this example)
            // For now, we'll use the history use case with a workaround
            const result = await this.getCallHistoryUseCase.execute({
                search: undefined // Would filter by ID if available
            });
            if (result.success && result.data && result.data.calls.length > 0) {
                const call = result.data.calls.find(c => c.toObject().id === id);
                if (call) {
                    const callDTO = this.callMapper.toDTO(call);
                    return this.success(res, callDTO);
                }
            }
            return this.notFound(res, 'Call record not found');
        }
        catch (error) {
            console.error('Error getting call by ID:', error);
            return this.internalError(res, 'Failed to retrieve call record');
        }
    }
    /**
     * Get calls by employee ID
     * GET /api/calls/employee/:employeeId
     */
    async getCallsByEmployee(req, res) {
        try {
            const { employeeId } = req.params;
            const pagination = this.getPaginationFromQuery(req);
            if (!employeeId) {
                return this.badRequest(res, 'Employee ID is required');
            }
            const result = await this.getCallHistoryUseCase.execute({
                search: { employeeId },
                pagination
            });
            if (result.success && result.data) {
                const callDTOs = result.data.calls.map(call => this.callMapper.toDTO(call));
                if (result.data.pagination) {
                    return this.paginated(res, callDTOs, result.data.pagination);
                }
                else {
                    return this.success(res, callDTOs);
                }
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error getting calls by employee:', error);
            return this.internalError(res, 'Failed to retrieve employee calls');
        }
    }
    /**
     * Get calls by broadcast ID
     * GET /api/calls/broadcast/:broadcastId
     */
    async getCallsByBroadcast(req, res) {
        try {
            const { broadcastId } = req.params;
            const pagination = this.getPaginationFromQuery(req);
            if (!broadcastId) {
                return this.badRequest(res, 'Broadcast ID is required');
            }
            const result = await this.getCallHistoryUseCase.execute({
                search: { broadcastId },
                pagination
            });
            if (result.success && result.data) {
                const callDTOs = result.data.calls.map(call => this.callMapper.toDTO(call));
                if (result.data.pagination) {
                    return this.paginated(res, callDTOs, result.data.pagination);
                }
                else {
                    return this.success(res, callDTOs);
                }
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error getting calls by broadcast:', error);
            return this.internalError(res, 'Failed to retrieve broadcast calls');
        }
    }
    /**
     * Get call statistics
     * GET /api/calls/statistics
     */
    async getCallStatistics(req, res) {
        try {
            const search = {};
            // Handle date range for statistics
            if (req.query.startDate && req.query.endDate) {
                search.dateRange = {
                    startDate: new Date(req.query.startDate),
                    endDate: new Date(req.query.endDate)
                };
            }
            const result = await this.getCallHistoryUseCase.execute({
                search: Object.keys(search).length > 0 ? search : undefined
            });
            if (result.success && result.data && result.data.statistics) {
                return this.success(res, result.data.statistics);
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error getting call statistics:', error);
            return this.internalError(res, 'Failed to retrieve call statistics');
        }
    }
    /**
     * Get call report
     * GET /api/calls/report
     */
    async getCallReport(req, res) {
        try {
            const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
            const result = await this.getCallHistoryUseCase.execute({
                search: {
                    dateRange: { startDate, endDate }
                }
            });
            if (result.success && result.data) {
                const reportDTO = this.callMapper.toReportDTO(result.data.calls, startDate, endDate);
                return this.success(res, reportDTO);
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error generating call report:', error);
            return this.internalError(res, 'Failed to generate call report');
        }
    }
};
exports.CallController = CallController;
exports.CallController = CallController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(CreateCallRecordUseCase_1.CreateCallRecordUseCase)),
    __param(1, (0, tsyringe_1.inject)(GetCallHistoryUseCase_1.GetCallHistoryUseCase)),
    __param(2, (0, tsyringe_1.inject)(UpdateCallStatusUseCase_1.UpdateCallStatusUseCase)),
    __param(3, (0, tsyringe_1.inject)(CallMapper_1.CallMapper)),
    __metadata("design:paramtypes", [CreateCallRecordUseCase_1.CreateCallRecordUseCase,
        GetCallHistoryUseCase_1.GetCallHistoryUseCase,
        UpdateCallStatusUseCase_1.UpdateCallStatusUseCase,
        CallMapper_1.CallMapper])
], CallController);
//# sourceMappingURL=CallController.js.map