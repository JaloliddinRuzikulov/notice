"use strict";
/**
 * Employee Controller
 * Handles HTTP requests for employee management
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
exports.EmployeeController = void 0;
const tsyringe_1 = require("tsyringe");
const BaseController_1 = require("../base/BaseController");
const CreateEmployeeUseCase_1 = require("@/application/usecases/employee/CreateEmployeeUseCase");
const GetEmployeeListUseCase_1 = require("@/application/usecases/employee/GetEmployeeListUseCase");
const UpdateEmployeeUseCase_1 = require("@/application/usecases/employee/UpdateEmployeeUseCase");
const DeleteEmployeeUseCase_1 = require("@/application/usecases/employee/DeleteEmployeeUseCase");
const EmployeeMapper_1 = require("@/application/mappers/employee/EmployeeMapper");
let EmployeeController = class EmployeeController extends BaseController_1.BaseController {
    createEmployeeUseCase;
    getEmployeeListUseCase;
    updateEmployeeUseCase;
    deleteEmployeeUseCase;
    employeeMapper;
    constructor(createEmployeeUseCase, getEmployeeListUseCase, updateEmployeeUseCase, deleteEmployeeUseCase, employeeMapper) {
        super();
        this.createEmployeeUseCase = createEmployeeUseCase;
        this.getEmployeeListUseCase = getEmployeeListUseCase;
        this.updateEmployeeUseCase = updateEmployeeUseCase;
        this.deleteEmployeeUseCase = deleteEmployeeUseCase;
        this.employeeMapper = employeeMapper;
    }
    /**
     * Create new employee
     * POST /api/employees
     */
    async createEmployee(req, res) {
        try {
            const validation = this.validateRequestBody(req, [
                'firstName', 'lastName', 'phoneNumber', 'department', 'district'
            ]);
            if (!validation.isValid) {
                return this.badRequest(res, 'Validation failed', validation.errors);
            }
            const createDTO = this.sanitizeInput({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                middleName: req.body.middleName,
                phoneNumber: req.body.phoneNumber,
                additionalPhone: req.body.additionalPhone,
                department: req.body.department,
                district: req.body.district,
                position: req.body.position,
                rank: req.body.rank,
                notes: req.body.notes,
                photoUrl: req.body.photoUrl
            });
            const result = await this.createEmployeeUseCase.execute(createDTO);
            if (result.success && result.data) {
                const employeeDTO = this.employeeMapper.toDTO(result.data.employee);
                return this.created(res, employeeDTO, 'Employee created successfully');
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error creating employee:', error);
            return this.internalError(res, 'Failed to create employee');
        }
    }
    /**
     * Get employee list with search and pagination
     * GET /api/employees
     */
    async getEmployees(req, res) {
        try {
            const pagination = this.getPaginationFromQuery(req);
            const search = {
                name: req.query.name,
                department: req.query.department,
                district: req.query.district,
                position: req.query.position,
                rank: req.query.rank,
                phoneNumber: req.query.phoneNumber,
                isActive: req.query.isActive ? req.query.isActive === 'true' : undefined
            };
            // Remove undefined values
            Object.keys(search).forEach(key => search[key] === undefined && delete search[key]);
            const result = await this.getEmployeeListUseCase.execute({
                search: Object.keys(search).length > 0 ? search : undefined,
                pagination
            });
            if (result.success && result.data) {
                const employeeDTOs = result.data.employees.map(emp => this.employeeMapper.toDTO(emp));
                if (result.data.pagination) {
                    return this.paginated(res, employeeDTOs, result.data.pagination);
                }
                else {
                    return this.success(res, employeeDTOs);
                }
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error getting employees:', error);
            return this.internalError(res, 'Failed to retrieve employees');
        }
    }
    /**
     * Get employee by ID
     * GET /api/employees/:id
     */
    async getEmployeeById(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return this.badRequest(res, 'Employee ID is required');
            }
            // This would use a GetEmployeeByIdUseCase (not implemented in this example)
            // For now, we'll use the list use case with a specific search
            const result = await this.getEmployeeListUseCase.execute({
                search: { name: id } // This is a workaround - ideally we'd have a separate use case
            });
            if (result.success && result.data && result.data.employees.length > 0) {
                const employee = result.data.employees.find(emp => emp.toObject().id === id);
                if (employee) {
                    const employeeDTO = this.employeeMapper.toDTO(employee);
                    return this.success(res, employeeDTO);
                }
            }
            return this.notFound(res, 'Employee not found');
        }
        catch (error) {
            console.error('Error getting employee by ID:', error);
            return this.internalError(res, 'Failed to retrieve employee');
        }
    }
    /**
     * Update employee
     * PUT /api/employees/:id
     */
    async updateEmployee(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return this.badRequest(res, 'Employee ID is required');
            }
            const updateDTO = this.sanitizeInput({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                middleName: req.body.middleName,
                phoneNumber: req.body.phoneNumber,
                additionalPhone: req.body.additionalPhone,
                department: req.body.department,
                district: req.body.district,
                position: req.body.position,
                rank: req.body.rank,
                notes: req.body.notes,
                photoUrl: req.body.photoUrl,
                isActive: req.body.isActive
            });
            // Remove undefined values
            Object.keys(updateDTO).forEach(key => updateDTO[key] === undefined && delete updateDTO[key]);
            const result = await this.updateEmployeeUseCase.execute({
                id,
                ...updateDTO
            });
            if (result.success && result.data) {
                const employeeDTO = this.employeeMapper.toDTO(result.data.employee);
                return this.success(res, employeeDTO, 'Employee updated successfully');
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error updating employee:', error);
            return this.internalError(res, 'Failed to update employee');
        }
    }
    /**
     * Delete employee (soft delete)
     * DELETE /api/employees/:id
     */
    async deleteEmployee(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return this.badRequest(res, 'Employee ID is required');
            }
            const result = await this.deleteEmployeeUseCase.execute({ id });
            if (result.success) {
                return this.noContent(res, 'Employee deleted successfully');
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error deleting employee:', error);
            return this.internalError(res, 'Failed to delete employee');
        }
    }
    /**
     * Get employees by department
     * GET /api/employees/department/:department
     */
    async getEmployeesByDepartment(req, res) {
        try {
            const { department } = req.params;
            const pagination = this.getPaginationFromQuery(req);
            const result = await this.getEmployeeListUseCase.execute({
                search: { department, isActive: true },
                pagination
            });
            if (result.success && result.data) {
                const employeeDTOs = result.data.employees.map(emp => this.employeeMapper.toDTO(emp));
                if (result.data.pagination) {
                    return this.paginated(res, employeeDTOs, result.data.pagination);
                }
                else {
                    return this.success(res, employeeDTOs);
                }
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error getting employees by department:', error);
            return this.internalError(res, 'Failed to retrieve employees');
        }
    }
    /**
     * Get employees by district
     * GET /api/employees/district/:district
     */
    async getEmployeesByDistrict(req, res) {
        try {
            const { district } = req.params;
            const pagination = this.getPaginationFromQuery(req);
            const result = await this.getEmployeeListUseCase.execute({
                search: { district, isActive: true },
                pagination
            });
            if (result.success && result.data) {
                const employeeDTOs = result.data.employees.map(emp => this.employeeMapper.toDTO(emp));
                if (result.data.pagination) {
                    return this.paginated(res, employeeDTOs, result.data.pagination);
                }
                else {
                    return this.success(res, employeeDTOs);
                }
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error getting employees by district:', error);
            return this.internalError(res, 'Failed to retrieve employees');
        }
    }
};
exports.EmployeeController = EmployeeController;
exports.EmployeeController = EmployeeController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(CreateEmployeeUseCase_1.CreateEmployeeUseCase)),
    __param(1, (0, tsyringe_1.inject)(GetEmployeeListUseCase_1.GetEmployeeListUseCase)),
    __param(2, (0, tsyringe_1.inject)(UpdateEmployeeUseCase_1.UpdateEmployeeUseCase)),
    __param(3, (0, tsyringe_1.inject)(DeleteEmployeeUseCase_1.DeleteEmployeeUseCase)),
    __param(4, (0, tsyringe_1.inject)(EmployeeMapper_1.EmployeeMapper)),
    __metadata("design:paramtypes", [CreateEmployeeUseCase_1.CreateEmployeeUseCase,
        GetEmployeeListUseCase_1.GetEmployeeListUseCase,
        UpdateEmployeeUseCase_1.UpdateEmployeeUseCase,
        DeleteEmployeeUseCase_1.DeleteEmployeeUseCase,
        EmployeeMapper_1.EmployeeMapper])
], EmployeeController);
//# sourceMappingURL=EmployeeController.js.map