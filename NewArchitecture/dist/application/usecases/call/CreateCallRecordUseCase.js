"use strict";
/**
 * Create Call Record Use Case
 * Handles creation of call history records
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
exports.CreateCallRecordUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const IUseCase_1 = require("../base/IUseCase");
const Call_1 = require("@/core/domain/entities/Call");
let CreateCallRecordUseCase = class CreateCallRecordUseCase {
    callRepository;
    employeeRepository;
    constructor(callRepository, employeeRepository) {
        this.callRepository = callRepository;
        this.employeeRepository = employeeRepository;
    }
    async execute(request) {
        try {
            // Validate request
            const validation = await this.validateRequest(request);
            if (!validation.isValid) {
                return (0, IUseCase_1.createErrorResult)('Validation failed', validation.errors);
            }
            // Get employee information
            const employee = await this.employeeRepository.findById(request.employeeId);
            if (!employee) {
                return (0, IUseCase_1.createErrorResult)('Employee not found');
            }
            const employeeData = employee.toObject();
            // Calculate duration if not provided
            let duration = request.duration;
            if (!duration && request.endTime) {
                duration = Math.round((request.endTime.getTime() - request.startTime.getTime()) / 1000);
            }
            // Create call entity
            const call = Call_1.Call.create({
                callId: `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                from: request.callerId || 'system',
                to: request.phoneNumber,
                direction: Call_1.CallDirection.OUTBOUND,
                type: request.broadcastId ? Call_1.CallType.BROADCAST : Call_1.CallType.DIRECT,
                status: request.status,
                broadcastId: request.broadcastId,
                employeeId: request.employeeId,
                startTime: request.startTime,
                endTime: request.endTime,
                duration: duration || 0
            });
            // Save call record
            const savedCall = await this.callRepository.save(call);
            return (0, IUseCase_1.createSuccessResult)({
                call: savedCall
            });
        }
        catch (error) {
            return (0, IUseCase_1.createErrorResult)(`Failed to create call record: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async validateRequest(request) {
        const errors = [];
        if (!request.employeeId?.trim()) {
            errors.push('Employee ID is required');
        }
        if (!request.phoneNumber?.trim()) {
            errors.push('Phone number is required');
        }
        else {
            // Basic phone number validation
            const phoneRegex = /^(\+998|998)?[0-9]{9}$/;
            if (!phoneRegex.test(request.phoneNumber.replace(/\s|-/g, ''))) {
                errors.push('Invalid phone number format');
            }
        }
        if (!request.startTime) {
            errors.push('Start time is required');
        }
        if (!request.status) {
            errors.push('Call status is required');
        }
        // Validate end time is after start time
        if (request.endTime && request.startTime && request.endTime < request.startTime) {
            errors.push('End time cannot be before start time');
        }
        // Validate duration matches time difference
        if (request.duration && request.endTime && request.startTime) {
            const calculatedDuration = Math.round((request.endTime.getTime() - request.startTime.getTime()) / 1000);
            const difference = Math.abs(calculatedDuration - request.duration);
            if (difference > 5) { // Allow 5 seconds tolerance
                errors.push('Duration does not match start and end times');
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
};
exports.CreateCallRecordUseCase = CreateCallRecordUseCase;
exports.CreateCallRecordUseCase = CreateCallRecordUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('ICallRepository')),
    __param(1, (0, tsyringe_1.inject)('IEmployeeRepository')),
    __metadata("design:paramtypes", [Object, Object])
], CreateCallRecordUseCase);
//# sourceMappingURL=CreateCallRecordUseCase.js.map