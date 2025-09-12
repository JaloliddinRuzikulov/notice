"use strict";
/**
 * Create Employee Use Case
 * Handles creation of new employee with validation
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
exports.CreateEmployeeUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const IUseCase_1 = require("../base/IUseCase");
const Employee_1 = require("@/core/domain/entities/Employee");
let CreateEmployeeUseCase = class CreateEmployeeUseCase {
    employeeRepository;
    constructor(employeeRepository) {
        this.employeeRepository = employeeRepository;
    }
    async execute(request) {
        try {
            // Validate required fields
            const validation = this.validateRequest(request);
            if (!validation.isValid) {
                return (0, IUseCase_1.createErrorResult)('Validation failed', validation.errors);
            }
            // Check if phone number already exists
            const existingEmployee = await this.employeeRepository.findByPhoneNumber(request.phoneNumber);
            if (existingEmployee) {
                return (0, IUseCase_1.createErrorResult)('Phone number already exists');
            }
            // Create employee entity
            const employee = Employee_1.Employee.create({
                firstName: request.firstName,
                lastName: request.lastName,
                middleName: request.middleName,
                phoneNumber: request.phoneNumber,
                additionalPhone: request.additionalPhone,
                department: request.department,
                district: request.district,
                position: request.position,
                rank: request.rank,
                notes: request.notes,
                photoUrl: request.photoUrl,
                isActive: true
            });
            // Save to repository
            const savedEmployee = await this.employeeRepository.save(employee);
            return (0, IUseCase_1.createSuccessResult)({
                employee: savedEmployee
            });
        }
        catch (error) {
            return (0, IUseCase_1.createErrorResult)(`Failed to create employee: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    validateRequest(request) {
        const errors = [];
        if (!request.firstName?.trim()) {
            errors.push('First name is required');
        }
        if (!request.lastName?.trim()) {
            errors.push('Last name is required');
        }
        if (!request.phoneNumber?.trim()) {
            errors.push('Phone number is required');
        }
        else {
            // Basic phone number validation (Uzbekistan format)
            const phoneRegex = /^(\+998|998)?[0-9]{9}$/;
            if (!phoneRegex.test(request.phoneNumber.replace(/\s|-/g, ''))) {
                errors.push('Invalid phone number format');
            }
        }
        if (!request.department?.trim()) {
            errors.push('Department is required');
        }
        if (!request.district?.trim()) {
            errors.push('District is required');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
};
exports.CreateEmployeeUseCase = CreateEmployeeUseCase;
exports.CreateEmployeeUseCase = CreateEmployeeUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IEmployeeRepository')),
    __metadata("design:paramtypes", [Object])
], CreateEmployeeUseCase);
//# sourceMappingURL=CreateEmployeeUseCase.js.map