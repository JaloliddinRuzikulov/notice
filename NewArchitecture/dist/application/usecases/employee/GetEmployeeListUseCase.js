"use strict";
/**
 * Get Employee List Use Case
 * Handles retrieving employees with search and pagination
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
exports.GetEmployeeListUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const IUseCase_1 = require("../base/IUseCase");
let GetEmployeeListUseCase = class GetEmployeeListUseCase {
    employeeRepository;
    constructor(employeeRepository) {
        this.employeeRepository = employeeRepository;
    }
    async execute(request) {
        try {
            // If pagination is requested
            if (request.pagination) {
                const paginationOptions = {
                    page: request.pagination.page || 1,
                    limit: request.pagination.limit || 10,
                    sortBy: request.pagination.sortBy || 'lastName',
                    sortOrder: request.pagination.sortOrder || 'ASC'
                };
                let result;
                // If search criteria provided
                if (request.search) {
                    const searchCriteria = {
                        name: request.search.name,
                        department: request.search.department,
                        district: request.search.district,
                        position: request.search.position,
                        rank: request.search.rank,
                        phoneNumber: request.search.phoneNumber,
                        isActive: request.search.isActive
                    };
                    result = await this.employeeRepository.searchPaginated(searchCriteria, paginationOptions);
                }
                else {
                    result = await this.employeeRepository.findPaginated(paginationOptions);
                }
                return (0, IUseCase_1.createSuccessResult)({
                    employees: result.data,
                    pagination: {
                        page: result.page,
                        limit: paginationOptions.limit,
                        total: result.total,
                        totalPages: result.totalPages
                    }
                });
            }
            // If no pagination, return all matching employees
            else {
                let employees;
                if (request.search) {
                    const searchCriteria = {
                        name: request.search.name,
                        department: request.search.department,
                        district: request.search.district,
                        position: request.search.position,
                        rank: request.search.rank,
                        phoneNumber: request.search.phoneNumber,
                        isActive: request.search.isActive
                    };
                    employees = await this.employeeRepository.search(searchCriteria);
                }
                else {
                    employees = await this.employeeRepository.findAll();
                }
                return (0, IUseCase_1.createSuccessResult)({
                    employees
                });
            }
        }
        catch (error) {
            return (0, IUseCase_1.createErrorResult)(`Failed to retrieve employees: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};
exports.GetEmployeeListUseCase = GetEmployeeListUseCase;
exports.GetEmployeeListUseCase = GetEmployeeListUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IEmployeeRepository')),
    __metadata("design:paramtypes", [Object])
], GetEmployeeListUseCase);
//# sourceMappingURL=GetEmployeeListUseCase.js.map