"use strict";
/**
 * Update Call Status Use Case
 * Handles updating call record status and information
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
exports.UpdateCallStatusUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const IUseCase_1 = require("../base/IUseCase");
const Call_1 = require("@/core/domain/entities/Call");
let UpdateCallStatusUseCase = class UpdateCallStatusUseCase {
    callRepository;
    constructor(callRepository) {
        this.callRepository = callRepository;
    }
    async execute(request) {
        try {
            // Validate request
            const validation = this.validateRequest(request);
            if (!validation.isValid) {
                return (0, IUseCase_1.createErrorResult)('Validation failed', validation.errors);
            }
            // Check if call exists
            const existingCall = await this.callRepository.findById(request.callId);
            if (!existingCall) {
                return (0, IUseCase_1.createErrorResult)('Call record not found');
            }
            const callData = existingCall.toObject();
            // Validate status transition
            const validTransition = this.isValidStatusTransition(callData.status, request.status);
            if (!validTransition.isValid) {
                return (0, IUseCase_1.createErrorResult)(validTransition.error);
            }
            // Calculate duration if not provided but endTime is
            let duration = request.duration;
            if (!duration && request.endTime && callData.startTime) {
                duration = Math.round((request.endTime.getTime() - callData.startTime.getTime()) / 1000);
            }
            // Create updated call data
            const updateData = {
                status: request.status,
                ...(request.endTime && { endTime: request.endTime }),
                ...(duration !== undefined && { duration }),
                ...(request.notes !== undefined && { notes: request.notes })
            };
            // Update call record
            const updatedCall = await this.callRepository.update(request.callId, updateData);
            if (!updatedCall) {
                return (0, IUseCase_1.createErrorResult)('Failed to update call record');
            }
            return (0, IUseCase_1.createSuccessResult)({
                call: updatedCall
            });
        }
        catch (error) {
            return (0, IUseCase_1.createErrorResult)(`Failed to update call status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    validateRequest(request) {
        const errors = [];
        if (!request.callId?.trim()) {
            errors.push('Call ID is required');
        }
        if (!request.status) {
            errors.push('Status is required');
        }
        // If status is completed or failed, endTime should be provided
        if ((request.status === Call_1.CallStatus.COMPLETED || request.status === Call_1.CallStatus.FAILED) && !request.endTime) {
            errors.push('End time is required when call is completed or failed');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    isValidStatusTransition(currentStatus, newStatus) {
        const validTransitions = {
            [Call_1.CallStatus.INITIATED]: [Call_1.CallStatus.RINGING, Call_1.CallStatus.FAILED, Call_1.CallStatus.CANCELLED],
            [Call_1.CallStatus.RINGING]: [Call_1.CallStatus.ANSWERED, Call_1.CallStatus.BUSY, Call_1.CallStatus.NO_ANSWER, Call_1.CallStatus.FAILED, Call_1.CallStatus.CANCELLED],
            [Call_1.CallStatus.ANSWERED]: [Call_1.CallStatus.COMPLETED, Call_1.CallStatus.FAILED, Call_1.CallStatus.CANCELLED],
            [Call_1.CallStatus.COMPLETED]: [], // Terminal state
            [Call_1.CallStatus.FAILED]: [], // Terminal state
            [Call_1.CallStatus.BUSY]: [], // Terminal state
            [Call_1.CallStatus.NO_ANSWER]: [], // Terminal state
            [Call_1.CallStatus.CANCELLED]: [] // Terminal state
        };
        const allowedTransitions = validTransitions[currentStatus] || [];
        if (!allowedTransitions.includes(newStatus)) {
            return {
                isValid: false,
                error: `Cannot change status from ${currentStatus} to ${newStatus}`
            };
        }
        return { isValid: true };
    }
};
exports.UpdateCallStatusUseCase = UpdateCallStatusUseCase;
exports.UpdateCallStatusUseCase = UpdateCallStatusUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('ICallRepository')),
    __metadata("design:paramtypes", [Object])
], UpdateCallStatusUseCase);
//# sourceMappingURL=UpdateCallStatusUseCase.js.map