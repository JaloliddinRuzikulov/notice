"use strict";
/**
 * Stop Broadcast Use Case
 * Handles stopping active broadcast
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
exports.StopBroadcastUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const IUseCase_1 = require("../base/IUseCase");
const Broadcast_1 = require("@/core/domain/entities/Broadcast");
let StopBroadcastUseCase = class StopBroadcastUseCase {
    broadcastRepository;
    constructor(broadcastRepository) {
        this.broadcastRepository = broadcastRepository;
    }
    async execute(request) {
        try {
            // Validate request
            if (!request.broadcastId?.trim()) {
                return (0, IUseCase_1.createErrorResult)('Broadcast ID is required');
            }
            if (!request.stoppedBy?.trim()) {
                return (0, IUseCase_1.createErrorResult)('User ID is required');
            }
            // Check if broadcast exists
            const broadcast = await this.broadcastRepository.findById(request.broadcastId);
            if (!broadcast) {
                return (0, IUseCase_1.createErrorResult)('Broadcast not found');
            }
            const broadcastData = broadcast.toObject();
            // Check if broadcast can be stopped
            if (broadcastData.status === Broadcast_1.BroadcastStatus.COMPLETED) {
                return (0, IUseCase_1.createErrorResult)('Broadcast already completed');
            }
            if (broadcastData.status === Broadcast_1.BroadcastStatus.CANCELLED) {
                return (0, IUseCase_1.createErrorResult)('Broadcast already cancelled');
            }
            if (broadcastData.status === Broadcast_1.BroadcastStatus.FAILED) {
                return (0, IUseCase_1.createErrorResult)('Broadcast already failed');
            }
            // Update broadcast status to cancelled
            const updated = await this.broadcastRepository.updateStatus(request.broadcastId, Broadcast_1.BroadcastStatus.CANCELLED);
            if (!updated) {
                return (0, IUseCase_1.createErrorResult)('Failed to stop broadcast');
            }
            // Record stop reason if provided
            // TODO: Implement addNote method in repository if needed
            // if (request.reason) {
            //   await this.broadcastRepository.addNote(request.broadcastId, {
            //     message: `Broadcast stopped: ${request.reason}`,
            //     createdBy: request.stoppedBy,
            //     createdAt: new Date()
            //   });
            // }
            return (0, IUseCase_1.createSuccessResult)({
                success: true,
                message: 'Broadcast successfully stopped'
            });
        }
        catch (error) {
            return (0, IUseCase_1.createErrorResult)(`Failed to stop broadcast: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};
exports.StopBroadcastUseCase = StopBroadcastUseCase;
exports.StopBroadcastUseCase = StopBroadcastUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IBroadcastRepository')),
    __metadata("design:paramtypes", [Object])
], StopBroadcastUseCase);
//# sourceMappingURL=StopBroadcastUseCase.js.map