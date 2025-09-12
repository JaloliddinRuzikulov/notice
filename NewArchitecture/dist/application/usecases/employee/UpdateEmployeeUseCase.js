"use strict";
/**
 * Update Employee Use Case
 * Handles updating existing employee information
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
exports.UpdateEmployeeUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const IUseCase_1 = require("../base/IUseCase");
let UpdateEmployeeUseCase = class UpdateEmployeeUseCase {
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
            // Check phone number uniqueness if it's being changed
            if (request.phoneNumber && request.phoneNumber !== existingEmployee.toObject().phoneNumber) {
                const phoneExists = await this.employeeRepository.findByPhoneNumber(request.phoneNumber);
                if (phoneExists) {
                    return (0, IUseCase_1.createErrorResult)('Phone number already exists');
                }
            }
            // Validate phone number format if provided
            if (request.phoneNumber) {
                const phoneRegex = /^(\+998|998)?[0-9]{9}$/;
                if (!phoneRegex.test(request.phoneNumber.replace(/\s|-/g, ''))) {
                    return (0, IUseCase_1.createErrorResult)('Invalid phone number format');
                }
            }
            // Create updated employee data
            const updateData = {
                ...(request.firstName && { firstName: request.firstName.trim() }),
                ...(request.lastName && { lastName: request.lastName.trim() }),
                ...(request.middleName && { middleName: request.middleName.trim() }),
                ...(request.phoneNumber && { phoneNumber: request.phoneNumber.trim() }),
                ...(request.additionalPhone && { additionalPhone: request.additionalPhone.trim() }),
                ...(request.department && { department: request.department.trim() }),
                ...(request.district && { district: request.district.trim() }),
                ...(request.position && { position: request.position.trim() }),
                ...(request.rank && { rank: request.rank.trim() }),
                ...(request.notes !== undefined && { notes: request.notes }),
                ...(request.photoUrl !== undefined && { photoUrl: request.photoUrl }),
                ...(request.isActive !== undefined && { isActive: request.isActive })
            };
            // Update employee
            const updatedEmployee = await this.employeeRepository.update(request.id, updateData);
            if (!updatedEmployee) {
                return (0, IUseCase_1.createErrorResult)('Failed to update employee');
            }
            return (0, IUseCase_1.createSuccessResult)({
                employee: updatedEmployee
            });
        }
        catch (error) {
            return (0, IUseCase_1.createErrorResult)(`Failed to update employee: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};
exports.UpdateEmployeeUseCase = UpdateEmployeeUseCase;
exports.UpdateEmployeeUseCase = UpdateEmployeeUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IEmployeeRepository')),
    __metadata("design:paramtypes", [Object])
], UpdateEmployeeUseCase);
//# sourceMappingURL=UpdateEmployeeUseCase.js.map