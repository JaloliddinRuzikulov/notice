"use strict";
/**
 * Get Call History Use Case
 * Handles retrieving call history with search and pagination
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
exports.GetCallHistoryUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const IUseCase_1 = require("../base/IUseCase");
const Call_1 = require("@/core/domain/entities/Call");
let GetCallHistoryUseCase = class GetCallHistoryUseCase {
    callRepository;
    constructor(callRepository) {
        this.callRepository = callRepository;
    }
    async execute(request) {
        try {
            let calls;
            // If search criteria provided
            if (request.search) {
                const searchCriteria = {
                    employeeId: request.search.employeeId,
                    // Note: employeeName is not available in CallSearchCriteria, using from/to for phone numbers
                    from: request.search.phoneNumber,
                    to: request.search.phoneNumber,
                    broadcastId: request.search.broadcastId,
                    status: request.search.status,
                    startDate: request.search.dateRange?.startDate,
                    endDate: request.search.dateRange?.endDate
                    // Note: minDuration and maxDuration are not available in CallSearchCriteria
                };
                calls = await this.callRepository.search(searchCriteria);
            }
            else {
                calls = await this.callRepository.findAll();
            }
            // Apply manual pagination if requested
            if (request.pagination) {
                const page = request.pagination.page || 1;
                const limit = request.pagination.limit || 20;
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                const paginatedCalls = calls.slice(startIndex, endIndex);
                // Calculate statistics
                const statistics = await this.calculateStatistics(request.search);
                return (0, IUseCase_1.createSuccessResult)({
                    calls: paginatedCalls,
                    pagination: {
                        total: calls.length,
                        page: page,
                        limit: limit,
                        totalPages: Math.ceil(calls.length / limit)
                    },
                    statistics
                });
            }
            // Calculate statistics
            const statistics = await this.calculateStatistics(request.search);
            return (0, IUseCase_1.createSuccessResult)({
                calls,
                statistics
            });
        }
        catch (error) {
            return (0, IUseCase_1.createErrorResult)(`Failed to retrieve call history: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async calculateStatistics(searchCriteria) {
        let calls;
        if (searchCriteria) {
            const criteria = {
                employeeId: searchCriteria.employeeId,
                from: searchCriteria.phoneNumber,
                to: searchCriteria.phoneNumber,
                broadcastId: searchCriteria.broadcastId,
                status: searchCriteria.status,
                startDate: searchCriteria.dateRange?.startDate,
                endDate: searchCriteria.dateRange?.endDate
            };
            calls = await this.callRepository.search(criteria);
        }
        else {
            calls = await this.callRepository.findAll();
        }
        const totalCalls = calls.length;
        const successfulCalls = calls.filter(call => call.toObject().status === Call_1.CallStatus.COMPLETED).length;
        const failedCalls = calls.filter(call => call.toObject().status === Call_1.CallStatus.FAILED).length;
        const totalDuration = calls.reduce((sum, call) => sum + (call.toObject().duration || 0), 0);
        const averageDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
        return {
            totalCalls,
            successfulCalls,
            failedCalls,
            averageDuration
        };
    }
};
exports.GetCallHistoryUseCase = GetCallHistoryUseCase;
exports.GetCallHistoryUseCase = GetCallHistoryUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('ICallRepository')),
    __metadata("design:paramtypes", [Object])
], GetCallHistoryUseCase);
//# sourceMappingURL=GetCallHistoryUseCase.js.map