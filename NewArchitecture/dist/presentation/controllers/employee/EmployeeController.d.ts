/**
 * Employee Controller
 * Handles HTTP requests for employee management
 */
import { Request, Response } from 'express';
import { BaseController } from '../base/BaseController';
import { CreateEmployeeUseCase } from '@/application/usecases/employee/CreateEmployeeUseCase';
import { GetEmployeeListUseCase } from '@/application/usecases/employee/GetEmployeeListUseCase';
import { UpdateEmployeeUseCase } from '@/application/usecases/employee/UpdateEmployeeUseCase';
import { DeleteEmployeeUseCase } from '@/application/usecases/employee/DeleteEmployeeUseCase';
import { EmployeeMapper } from '@/application/mappers/employee/EmployeeMapper';
export declare class EmployeeController extends BaseController {
    private createEmployeeUseCase;
    private getEmployeeListUseCase;
    private updateEmployeeUseCase;
    private deleteEmployeeUseCase;
    private employeeMapper;
    constructor(createEmployeeUseCase: CreateEmployeeUseCase, getEmployeeListUseCase: GetEmployeeListUseCase, updateEmployeeUseCase: UpdateEmployeeUseCase, deleteEmployeeUseCase: DeleteEmployeeUseCase, employeeMapper: EmployeeMapper);
    /**
     * Create new employee
     * POST /api/employees
     */
    createEmployee(req: Request, res: Response): Promise<Response>;
    /**
     * Get employee list with search and pagination
     * GET /api/employees
     */
    getEmployees(req: Request, res: Response): Promise<Response>;
    /**
     * Get employee by ID
     * GET /api/employees/:id
     */
    getEmployeeById(req: Request, res: Response): Promise<Response>;
    /**
     * Update employee
     * PUT /api/employees/:id
     */
    updateEmployee(req: Request, res: Response): Promise<Response>;
    /**
     * Delete employee (soft delete)
     * DELETE /api/employees/:id
     */
    deleteEmployee(req: Request, res: Response): Promise<Response>;
    /**
     * Get employees by department
     * GET /api/employees/department/:department
     */
    getEmployeesByDepartment(req: Request, res: Response): Promise<Response>;
    /**
     * Get employees by district
     * GET /api/employees/district/:district
     */
    getEmployeesByDistrict(req: Request, res: Response): Promise<Response>;
}
//# sourceMappingURL=EmployeeController.d.ts.map