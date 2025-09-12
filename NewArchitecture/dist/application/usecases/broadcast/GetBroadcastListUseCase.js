"use strict";
/**
 * Get Broadcast List Use Case
 * Handles retrieving broadcast list with search and pagination
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
exports.GetBroadcastListUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const IUseCase_1 = require("../base/IUseCase");
let GetBroadcastListUseCase = class GetBroadcastListUseCase {
    broadcastRepository;
    constructor(broadcastRepository) {
        this.broadcastRepository = broadcastRepository;
    }
    async execute(request) {
        try {
            let broadcasts;
            // If search criteria provided
            if (request.search) {
                const searchCriteria = {
                    title: request.search.name, // Using 'title' instead of 'name'
                    type: request.search.type,
                    status: request.search.status,
                    createdBy: request.search.createdBy,
                    startDate: request.search.dateRange?.startDate,
                    endDate: request.search.dateRange?.endDate
                };
                broadcasts = await this.broadcastRepository.search(searchCriteria);
            }
            else {
                broadcasts = await this.broadcastRepository.findAll();
            }
            // Apply manual pagination if requested
            if (request.pagination) {
                const page = request.pagination.page || 1;
                const limit = request.pagination.limit || 10;
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                const paginatedBroadcasts = broadcasts.slice(startIndex, endIndex);
                return (0, IUseCase_1.createSuccessResult)({
                    broadcasts: paginatedBroadcasts,
                    pagination: {
                        total: broadcasts.length,
                        page: page,
                        limit: limit,
                        totalPages: Math.ceil(broadcasts.length / limit)
                    }
                });
            }
            return (0, IUseCase_1.createSuccessResult)({
                broadcasts
            });
        }
        catch (error) {
            return (0, IUseCase_1.createErrorResult)(`Failed to retrieve broadcasts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};
exports.GetBroadcastListUseCase = GetBroadcastListUseCase;
exports.GetBroadcastListUseCase = GetBroadcastListUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IBroadcastRepository')),
    __metadata("design:paramtypes", [Object])
], GetBroadcastListUseCase);
//# sourceMappingURL=GetBroadcastListUseCase.js.map