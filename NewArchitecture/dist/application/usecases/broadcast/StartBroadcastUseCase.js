"use strict";
/**
 * Start Broadcast Use Case
 * Handles starting mass notification broadcast
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
exports.StartBroadcastUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const IUseCase_1 = require("../base/IUseCase");
const Broadcast_1 = require("@/core/domain/entities/Broadcast");
let StartBroadcastUseCase = class StartBroadcastUseCase {
    broadcastRepository;
    employeeRepository;
    audioFileRepository;
    constructor(broadcastRepository, employeeRepository, audioFileRepository) {
        this.broadcastRepository = broadcastRepository;
        this.employeeRepository = employeeRepository;
        this.audioFileRepository = audioFileRepository;
    }
    async execute(request) {
        try {
            // Validate request
            const validation = await this.validateRequest(request);
            if (!validation.isValid) {
                return (0, IUseCase_1.createErrorResult)('Validation failed', validation.errors);
            }
            // Get target employees
            const targetEmployees = await this.getTargetEmployees(request);
            if (targetEmployees.length === 0) {
                return (0, IUseCase_1.createErrorResult)('No target employees found');
            }
            // Create broadcast entity
            const broadcast = Broadcast_1.Broadcast.create({
                title: request.name || 'New Broadcast',
                type: request.type,
                message: request.message || '',
                audioFileUrl: request.audioFileId, // Using audioFileId as URL for now
                priority: Broadcast_1.BroadcastPriority.NORMAL,
                status: request.scheduledFor && request.scheduledFor > new Date()
                    ? Broadcast_1.BroadcastStatus.PENDING
                    : Broadcast_1.BroadcastStatus.IN_PROGRESS,
                recipients: targetEmployees.map(emp => ({
                    employeeId: emp.toObject().id,
                    phoneNumber: emp.phoneNumber,
                    name: emp.fullName,
                    status: 'pending',
                    attempts: 0
                })),
                departmentIds: request.targetDepartments || [],
                districtIds: request.targetDistricts || [],
                groupIds: [],
                scheduledAt: request.scheduledFor,
                totalRecipients: targetEmployees.length,
                successCount: 0,
                failureCount: 0,
                createdBy: request.createdBy
            });
            // Save broadcast
            const savedBroadcast = await this.broadcastRepository.save(broadcast);
            // If not scheduled for future, start immediately
            if (!request.scheduledFor || request.scheduledFor <= new Date()) {
                await this.broadcastRepository.updateStatus(savedBroadcast.toObject().id, Broadcast_1.BroadcastStatus.IN_PROGRESS);
            }
            return (0, IUseCase_1.createSuccessResult)({
                broadcast: savedBroadcast
            });
        }
        catch (error) {
            return (0, IUseCase_1.createErrorResult)(`Failed to start broadcast: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async validateRequest(request) {
        const errors = [];
        // Validate basic fields
        if (!request.name?.trim()) {
            errors.push('Broadcast name is required');
        }
        if (!request.type) {
            errors.push('Broadcast type is required');
        }
        if (!request.createdBy?.trim()) {
            errors.push('Creator ID is required');
        }
        // Validate content based on type
        if (request.type === Broadcast_1.BroadcastType.VOICE && !request.audioFileId) {
            errors.push('Audio file is required for voice broadcast');
        }
        if (request.type === Broadcast_1.BroadcastType.SMS && !request.message?.trim()) {
            errors.push('Message is required for SMS broadcast');
        }
        // Validate audio file exists if provided
        if (request.audioFileId) {
            const audioFile = await this.audioFileRepository.findById(request.audioFileId);
            if (!audioFile) {
                errors.push('Audio file not found');
            }
        }
        // Validate at least one target is specified
        const hasTargets = (request.targetEmployees && request.targetEmployees.length > 0) ||
            (request.targetDepartments && request.targetDepartments.length > 0) ||
            (request.targetDistricts && request.targetDistricts.length > 0);
        if (!hasTargets) {
            errors.push('At least one target (employees, departments, or districts) must be specified');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    async getTargetEmployees(request) {
        const targetEmployees = [];
        // Get specific employees
        if (request.targetEmployees && request.targetEmployees.length > 0) {
            for (const employeeId of request.targetEmployees) {
                const employee = await this.employeeRepository.findById(employeeId);
                if (employee && employee.toObject().isActive) {
                    targetEmployees.push(employee);
                }
            }
        }
        // Get employees by departments
        if (request.targetDepartments && request.targetDepartments.length > 0) {
            for (const department of request.targetDepartments) {
                const employees = await this.employeeRepository.search({
                    department: department,
                    isActive: true
                });
                targetEmployees.push(...employees);
            }
        }
        // Get employees by districts
        if (request.targetDistricts && request.targetDistricts.length > 0) {
            for (const district of request.targetDistricts) {
                const employees = await this.employeeRepository.search({
                    district: district,
                    isActive: true
                });
                targetEmployees.push(...employees);
            }
        }
        // Remove duplicates
        const uniqueEmployees = targetEmployees.filter((employee, index, self) => index === self.findIndex(e => e.toObject().id === employee.toObject().id));
        return uniqueEmployees;
    }
};
exports.StartBroadcastUseCase = StartBroadcastUseCase;
exports.StartBroadcastUseCase = StartBroadcastUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IBroadcastRepository')),
    __param(1, (0, tsyringe_1.inject)('IEmployeeRepository')),
    __param(2, (0, tsyringe_1.inject)('IAudioFileRepository')),
    __metadata("design:paramtypes", [Object, Object, Object])
], StartBroadcastUseCase);
//# sourceMappingURL=StartBroadcastUseCase.js.map