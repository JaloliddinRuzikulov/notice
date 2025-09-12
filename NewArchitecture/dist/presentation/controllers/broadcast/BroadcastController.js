"use strict";
/**
 * Broadcast Controller
 * Handles HTTP requests for broadcast management
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
exports.BroadcastController = void 0;
const tsyringe_1 = require("tsyringe");
const BaseController_1 = require("../base/BaseController");
const StartBroadcastUseCase_1 = require("@/application/usecases/broadcast/StartBroadcastUseCase");
const StopBroadcastUseCase_1 = require("@/application/usecases/broadcast/StopBroadcastUseCase");
const GetBroadcastStatusUseCase_1 = require("@/application/usecases/broadcast/GetBroadcastStatusUseCase");
const GetBroadcastListUseCase_1 = require("@/application/usecases/broadcast/GetBroadcastListUseCase");
const BroadcastMapper_1 = require("@/application/mappers/broadcast/BroadcastMapper");
const Broadcast_1 = require("@/core/domain/entities/Broadcast");
let BroadcastController = class BroadcastController extends BaseController_1.BaseController {
    startBroadcastUseCase;
    stopBroadcastUseCase;
    getBroadcastStatusUseCase;
    getBroadcastListUseCase;
    broadcastMapper;
    constructor(startBroadcastUseCase, stopBroadcastUseCase, getBroadcastStatusUseCase, getBroadcastListUseCase, broadcastMapper) {
        super();
        this.startBroadcastUseCase = startBroadcastUseCase;
        this.stopBroadcastUseCase = stopBroadcastUseCase;
        this.getBroadcastStatusUseCase = getBroadcastStatusUseCase;
        this.getBroadcastListUseCase = getBroadcastListUseCase;
        this.broadcastMapper = broadcastMapper;
    }
    /**
     * Start new broadcast
     * POST /api/broadcasts
     */
    async startBroadcast(req, res) {
        try {
            const user = this.getUserFromRequest(req);
            if (!user.id) {
                return this.unauthorized(res, 'User not authenticated');
            }
            const validation = this.validateRequestBody(req, ['name', 'type']);
            if (!validation.isValid) {
                return this.badRequest(res, 'Validation failed', validation.errors);
            }
            // Validate broadcast type
            if (!Object.values(Broadcast_1.BroadcastType).includes(req.body.type)) {
                return this.badRequest(res, 'Invalid broadcast type');
            }
            // Validate required fields based on type
            if (req.body.type === Broadcast_1.BroadcastType.VOICE && !req.body.audioFileId) {
                return this.badRequest(res, 'Audio file ID is required for voice broadcast');
            }
            if (req.body.type === Broadcast_1.BroadcastType.SMS && !req.body.message) {
                return this.badRequest(res, 'Message is required for SMS broadcast');
            }
            const createDTO = this.sanitizeInput({
                name: req.body.name,
                type: req.body.type,
                audioFileId: req.body.audioFileId,
                message: req.body.message,
                targetEmployees: req.body.targetEmployees || [],
                targetDepartments: req.body.targetDepartments || [],
                targetDistricts: req.body.targetDistricts || [],
                scheduledFor: req.body.scheduledFor ? new Date(req.body.scheduledFor) : undefined
            });
            const result = await this.startBroadcastUseCase.execute({
                ...createDTO,
                createdBy: user.id
            });
            if (result.success && result.data) {
                const responseDTO = this.broadcastMapper.toStartResponseDTO(result.data.broadcast);
                return this.created(res, responseDTO, 'Broadcast started successfully');
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error starting broadcast:', error);
            return this.internalError(res, 'Failed to start broadcast');
        }
    }
    /**
     * Stop active broadcast
     * POST /api/broadcasts/:id/stop
     */
    async stopBroadcast(req, res) {
        try {
            const user = this.getUserFromRequest(req);
            const { id } = req.params;
            if (!user.id) {
                return this.unauthorized(res, 'User not authenticated');
            }
            if (!id) {
                return this.badRequest(res, 'Broadcast ID is required');
            }
            const stopDTO = {
                reason: this.sanitizeInput(req.body.reason)
            };
            const result = await this.stopBroadcastUseCase.execute({
                broadcastId: id,
                stoppedBy: user.id,
                reason: stopDTO.reason
            });
            if (result.success) {
                return this.noContent(res, 'Broadcast stopped successfully');
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error stopping broadcast:', error);
            return this.internalError(res, 'Failed to stop broadcast');
        }
    }
    /**
     * Get broadcast status and progress
     * GET /api/broadcasts/:id/status
     */
    async getBroadcastStatus(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return this.badRequest(res, 'Broadcast ID is required');
            }
            const result = await this.getBroadcastStatusUseCase.execute({
                broadcastId: id
            });
            if (result.success && result.data) {
                const statusDTO = this.broadcastMapper.toStatusDTO(result.data.broadcast, result.data.progress, result.data.callHistory);
                return this.success(res, statusDTO);
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error getting broadcast status:', error);
            return this.internalError(res, 'Failed to retrieve broadcast status');
        }
    }
    /**
     * Get broadcast list with search and pagination
     * GET /api/broadcasts
     */
    async getBroadcasts(req, res) {
        try {
            const pagination = this.getPaginationFromQuery(req);
            const search = {
                name: req.query.name,
                type: req.query.type,
                status: req.query.status,
                createdBy: req.query.createdBy
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
            const result = await this.getBroadcastListUseCase.execute({
                search: Object.keys(search).length > 0 ? search : undefined,
                pagination
            });
            if (result.success && result.data) {
                const broadcastDTOs = result.data.broadcasts.map(broadcast => this.broadcastMapper.toDTO(broadcast));
                if (result.data.pagination) {
                    return this.paginated(res, broadcastDTOs, result.data.pagination);
                }
                else {
                    return this.success(res, broadcastDTOs);
                }
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error getting broadcasts:', error);
            return this.internalError(res, 'Failed to retrieve broadcasts');
        }
    }
    /**
     * Get broadcast by ID
     * GET /api/broadcasts/:id
     */
    async getBroadcastById(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return this.badRequest(res, 'Broadcast ID is required');
            }
            // Use the status endpoint which includes full broadcast details
            const result = await this.getBroadcastStatusUseCase.execute({
                broadcastId: id
            });
            if (result.success && result.data) {
                const broadcastDTO = this.broadcastMapper.toDTO(result.data.broadcast);
                return this.success(res, broadcastDTO);
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error getting broadcast by ID:', error);
            return this.internalError(res, 'Failed to retrieve broadcast');
        }
    }
    /**
     * Get active broadcasts
     * GET /api/broadcasts/active
     */
    async getActiveBroadcasts(req, res) {
        try {
            const pagination = this.getPaginationFromQuery(req);
            const result = await this.getBroadcastListUseCase.execute({
                search: { status: Broadcast_1.BroadcastStatus.IN_PROGRESS },
                pagination
            });
            if (result.success && result.data) {
                const broadcastDTOs = result.data.broadcasts.map(broadcast => this.broadcastMapper.toSummaryDTO(broadcast));
                if (result.data.pagination) {
                    return this.paginated(res, broadcastDTOs, result.data.pagination);
                }
                else {
                    return this.success(res, broadcastDTOs);
                }
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error getting active broadcasts:', error);
            return this.internalError(res, 'Failed to retrieve active broadcasts');
        }
    }
    /**
     * Get user's broadcasts
     * GET /api/broadcasts/my
     */
    async getUserBroadcasts(req, res) {
        try {
            const user = this.getUserFromRequest(req);
            const pagination = this.getPaginationFromQuery(req);
            if (!user.id) {
                return this.unauthorized(res, 'User not authenticated');
            }
            const result = await this.getBroadcastListUseCase.execute({
                search: { createdBy: user.id },
                pagination
            });
            if (result.success && result.data) {
                const broadcastDTOs = result.data.broadcasts.map(broadcast => this.broadcastMapper.toSummaryDTO(broadcast));
                if (result.data.pagination) {
                    return this.paginated(res, broadcastDTOs, result.data.pagination);
                }
                else {
                    return this.success(res, broadcastDTOs);
                }
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error getting user broadcasts:', error);
            return this.internalError(res, 'Failed to retrieve user broadcasts');
        }
    }
};
exports.BroadcastController = BroadcastController;
exports.BroadcastController = BroadcastController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(StartBroadcastUseCase_1.StartBroadcastUseCase)),
    __param(1, (0, tsyringe_1.inject)(StopBroadcastUseCase_1.StopBroadcastUseCase)),
    __param(2, (0, tsyringe_1.inject)(GetBroadcastStatusUseCase_1.GetBroadcastStatusUseCase)),
    __param(3, (0, tsyringe_1.inject)(GetBroadcastListUseCase_1.GetBroadcastListUseCase)),
    __param(4, (0, tsyringe_1.inject)(BroadcastMapper_1.BroadcastMapper)),
    __metadata("design:paramtypes", [StartBroadcastUseCase_1.StartBroadcastUseCase,
        StopBroadcastUseCase_1.StopBroadcastUseCase,
        GetBroadcastStatusUseCase_1.GetBroadcastStatusUseCase,
        GetBroadcastListUseCase_1.GetBroadcastListUseCase,
        BroadcastMapper_1.BroadcastMapper])
], BroadcastController);
//# sourceMappingURL=BroadcastController.js.map