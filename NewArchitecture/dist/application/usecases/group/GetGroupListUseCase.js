"use strict";
/**
 * Get Group List Use Case
 * Handles retrieving groups with search and pagination
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
exports.GetGroupListUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const IUseCase_1 = require("../base/IUseCase");
let GetGroupListUseCase = class GetGroupListUseCase {
    groupRepository;
    constructor(groupRepository) {
        this.groupRepository = groupRepository;
    }
    async execute(request) {
        try {
            let groups;
            // If search criteria provided
            if (request.search) {
                const searchCriteria = {
                    name: request.search.name,
                    createdBy: request.search.createdBy,
                    isActive: request.search.isActive
                    // Note: hasEmployee is not available in GroupSearchCriteria
                };
                groups = await this.groupRepository.search(searchCriteria);
            }
            else {
                groups = await this.groupRepository.findAll();
            }
            // Apply manual pagination if requested
            if (request.pagination) {
                const page = request.pagination.page || 1;
                const limit = request.pagination.limit || 10;
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                const paginatedGroups = groups.slice(startIndex, endIndex);
                // Enhance groups with employee details if requested
                const enhancedGroups = request.includeEmployees
                    ? await this.enhanceGroupsWithEmployees(paginatedGroups)
                    : paginatedGroups;
                return (0, IUseCase_1.createSuccessResult)({
                    groups: enhancedGroups,
                    pagination: {
                        total: groups.length,
                        page: page,
                        limit: limit,
                        totalPages: Math.ceil(groups.length / limit)
                    }
                });
            }
            // Enhance groups with employee details if requested
            const enhancedGroups = request.includeEmployees
                ? await this.enhanceGroupsWithEmployees(groups)
                : groups;
            return (0, IUseCase_1.createSuccessResult)({
                groups: enhancedGroups
            });
        }
        catch (error) {
            return (0, IUseCase_1.createErrorResult)(`Failed to retrieve groups: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async enhanceGroupsWithEmployees(groups) {
        const enhancedGroups = [];
        for (const group of groups) {
            const groupData = group.toObject();
            const employees = await this.groupRepository.getMembers(groupData.id);
            enhancedGroups.push({
                ...group,
                employees: employees.map(emp => ({
                    id: emp.id,
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    phoneNumber: emp.phoneNumber,
                    department: emp.department,
                    isActive: emp.isActive
                }))
            });
        }
        return enhancedGroups;
    }
};
exports.GetGroupListUseCase = GetGroupListUseCase;
exports.GetGroupListUseCase = GetGroupListUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IGroupRepository')),
    __metadata("design:paramtypes", [Object])
], GetGroupListUseCase);
//# sourceMappingURL=GetGroupListUseCase.js.map