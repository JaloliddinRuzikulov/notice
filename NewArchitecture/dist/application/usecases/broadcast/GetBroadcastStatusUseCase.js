"use strict";
/**
 * Get Broadcast Status Use Case
 * Handles retrieving broadcast status and progress
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
exports.GetBroadcastStatusUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const IUseCase_1 = require("../base/IUseCase");
const Call_1 = require("@/core/domain/entities/Call");
let GetBroadcastStatusUseCase = class GetBroadcastStatusUseCase {
    broadcastRepository;
    callRepository;
    constructor(broadcastRepository, callRepository) {
        this.broadcastRepository = broadcastRepository;
        this.callRepository = callRepository;
    }
    async execute(request) {
        try {
            // Validate request
            if (!request.broadcastId?.trim()) {
                return (0, IUseCase_1.createErrorResult)('Broadcast ID is required');
            }
            // Get broadcast
            const broadcast = await this.broadcastRepository.findById(request.broadcastId);
            if (!broadcast) {
                return (0, IUseCase_1.createErrorResult)('Broadcast not found');
            }
            const broadcastData = broadcast.toObject();
            // Get call history for this broadcast
            const calls = await this.callRepository.findByBroadcast(request.broadcastId);
            // Calculate progress
            const totalTargets = broadcastData.recipients ? broadcastData.recipients.length : 0;
            const completed = calls.filter(call => call.toObject().status === Call_1.CallStatus.COMPLETED).length;
            const inProgress = calls.filter(call => call.toObject().status === Call_1.CallStatus.INITIATED ||
                call.toObject().status === Call_1.CallStatus.RINGING ||
                call.toObject().status === Call_1.CallStatus.ANSWERED).length;
            const failed = calls.filter(call => call.toObject().status === Call_1.CallStatus.FAILED ||
                call.toObject().status === Call_1.CallStatus.NO_ANSWER ||
                call.toObject().status === Call_1.CallStatus.BUSY).length;
            const pending = totalTargets - completed - inProgress - failed;
            const progressPercentage = totalTargets > 0 ? Math.round((completed / totalTargets) * 100) : 0;
            // Prepare call history
            const callHistory = calls.map(call => {
                const callData = call.toObject();
                return {
                    employeeId: callData.employeeId,
                    employeeName: 'Unknown', // Will need to look up from employee repository if needed
                    phoneNumber: callData.to, // Using 'to' field for phone number
                    status: callData.status,
                    startTime: callData.startTime,
                    endTime: callData.endTime,
                    duration: callData.duration
                };
            });
            const response = {
                broadcast,
                progress: {
                    totalTargets,
                    completed,
                    inProgress,
                    failed,
                    pending,
                    progressPercentage
                },
                callHistory
            };
            return (0, IUseCase_1.createSuccessResult)(response);
        }
        catch (error) {
            return (0, IUseCase_1.createErrorResult)(`Failed to get broadcast status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};
exports.GetBroadcastStatusUseCase = GetBroadcastStatusUseCase;
exports.GetBroadcastStatusUseCase = GetBroadcastStatusUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IBroadcastRepository')),
    __param(1, (0, tsyringe_1.inject)('ICallRepository')),
    __metadata("design:paramtypes", [Object, Object])
], GetBroadcastStatusUseCase);
//# sourceMappingURL=GetBroadcastStatusUseCase.js.map