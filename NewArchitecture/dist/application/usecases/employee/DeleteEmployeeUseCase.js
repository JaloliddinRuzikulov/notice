"use strict";
/**
 * Delete Employee Use Case
 * Handles soft deletion of employee
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
exports.DeleteEmployeeUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const IUseCase_1 = require("../base/IUseCase");
let DeleteEmployeeUseCase = class DeleteEmployeeUseCase {
    employeeRepository;
    constructor(employeeRepository) {
        this.employeeRepository = employeeRepository;
    }
    async execute(request) {
        try {
            // Validate request
            if (!request.id?.trim()) {
                return (0, IUseCase_1.createErrorResult)('Employee ID is required');
            }
            // Check if employee exists
            const existingEmployee = await this.employeeRepository.findById(request.id);
            if (!existingEmployee) {
                return (0, IUseCase_1.createErrorResult)('Employee not found');
            }
            // TODO: Check if employee is referenced in any active broadcasts or calls
            // This would require additional repository checks
            // Perform soft delete (deactivate employee)
            const deactivated = await this.employeeRepository.deactivateEmployee(request.id);
            if (!deactivated) {
                return (0, IUseCase_1.createErrorResult)('Failed to delete employee');
            }
            return (0, IUseCase_1.createSuccessResult)({
                success: true,
                message: 'Employee successfully deleted'
            });
        }
        catch (error) {
            return (0, IUseCase_1.createErrorResult)(`Failed to delete employee: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};
exports.DeleteEmployeeUseCase = DeleteEmployeeUseCase;
exports.DeleteEmployeeUseCase = DeleteEmployeeUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IEmployeeRepository')),
    __metadata("design:paramtypes", [Object])
], DeleteEmployeeUseCase);
//# sourceMappingURL=DeleteEmployeeUseCase.js.map