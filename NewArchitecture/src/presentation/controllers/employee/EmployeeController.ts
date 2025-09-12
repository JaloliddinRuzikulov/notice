/**
 * Employee Controller
 * Handles HTTP requests for employee management
 */

import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { BaseController } from '../base/BaseController';
import { CreateEmployeeUseCase } from '@/application/usecases/employee/CreateEmployeeUseCase';
import { GetEmployeeListUseCase } from '@/application/usecases/employee/GetEmployeeListUseCase';
import { UpdateEmployeeUseCase } from '@/application/usecases/employee/UpdateEmployeeUseCase';
import { DeleteEmployeeUseCase } from '@/application/usecases/employee/DeleteEmployeeUseCase';
import { EmployeeMapper } from '@/application/mappers/employee/EmployeeMapper';
import { CreateEmployeeDTO, UpdateEmployeeDTO, EmployeeSearchDTO } from '@/application/dto/employee/EmployeeDTO';

@injectable()
export class EmployeeController extends BaseController {
  constructor(
    @inject(CreateEmployeeUseCase)
    private createEmployeeUseCase: CreateEmployeeUseCase,
    @inject(GetEmployeeListUseCase)
    private getEmployeeListUseCase: GetEmployeeListUseCase,
    @inject(UpdateEmployeeUseCase)
    private updateEmployeeUseCase: UpdateEmployeeUseCase,
    @inject(DeleteEmployeeUseCase)
    private deleteEmployeeUseCase: DeleteEmployeeUseCase,
    @inject(EmployeeMapper)
    private employeeMapper: EmployeeMapper
  ) {
    super();
  }

  /**
   * Create new employee
   * POST /api/employees
   */
  async createEmployee(req: Request, res: Response): Promise<Response> {
    try {
      const validation = this.validateRequestBody(req, [
        'firstName', 'lastName', 'phoneNumber', 'department', 'district'
      ]);

      if (!validation.isValid) {
        return this.badRequest(res, 'Validation failed', validation.errors);
      }

      const createDTO: CreateEmployeeDTO = this.sanitizeInput({
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

    } catch (error) {
      console.error('Error creating employee:', error);
      return this.internalError(res, 'Failed to create employee');
    }
  }

  /**
   * Get employee list with search and pagination
   * GET /api/employees
   */
  async getEmployees(req: Request, res: Response): Promise<Response> {
    try {
      const pagination = this.getPaginationFromQuery(req);
      
      const search: EmployeeSearchDTO = {
        name: req.query.name as string,
        department: req.query.department as string,
        district: req.query.district as string,
        position: req.query.position as string,
        rank: req.query.rank as string,
        phoneNumber: req.query.phoneNumber as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined
      };

      // Remove undefined values
      Object.keys(search).forEach(key => 
        search[key as keyof EmployeeSearchDTO] === undefined && delete search[key as keyof EmployeeSearchDTO]
      );

      const result = await this.getEmployeeListUseCase.execute({
        search: Object.keys(search).length > 0 ? search : undefined,
        pagination
      });

      if (result.success && result.data) {
        const employeeDTOs = result.data.employees.map(emp => this.employeeMapper.toDTO(emp));
        
        if (result.data.pagination) {
          return this.paginated(res, employeeDTOs, result.data.pagination);
        } else {
          return this.success(res, employeeDTOs);
        }
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error getting employees:', error);
      return this.internalError(res, 'Failed to retrieve employees');
    }
  }

  /**
   * Get employee by ID
   * GET /api/employees/:id
   */
  async getEmployeeById(req: Request, res: Response): Promise<Response> {
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

    } catch (error) {
      console.error('Error getting employee by ID:', error);
      return this.internalError(res, 'Failed to retrieve employee');
    }
  }

  /**
   * Update employee
   * PUT /api/employees/:id
   */
  async updateEmployee(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return this.badRequest(res, 'Employee ID is required');
      }

      const updateDTO: UpdateEmployeeDTO = this.sanitizeInput({
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
      Object.keys(updateDTO).forEach(key => 
        updateDTO[key as keyof UpdateEmployeeDTO] === undefined && delete updateDTO[key as keyof UpdateEmployeeDTO]
      );

      const result = await this.updateEmployeeUseCase.execute({
        id,
        ...updateDTO
      });

      if (result.success && result.data) {
        const employeeDTO = this.employeeMapper.toDTO(result.data.employee);
        return this.success(res, employeeDTO, 'Employee updated successfully');
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error updating employee:', error);
      return this.internalError(res, 'Failed to update employee');
    }
  }

  /**
   * Delete employee (soft delete)
   * DELETE /api/employees/:id
   */
  async deleteEmployee(req: Request, res: Response): Promise<Response> {
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

    } catch (error) {
      console.error('Error deleting employee:', error);
      return this.internalError(res, 'Failed to delete employee');
    }
  }

  /**
   * Get employees by department
   * GET /api/employees/department/:department
   */
  async getEmployeesByDepartment(req: Request, res: Response): Promise<Response> {
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
        } else {
          return this.success(res, employeeDTOs);
        }
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error getting employees by department:', error);
      return this.internalError(res, 'Failed to retrieve employees');
    }
  }

  /**
   * Get employees by district
   * GET /api/employees/district/:district
   */
  async getEmployeesByDistrict(req: Request, res: Response): Promise<Response> {
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
        } else {
          return this.success(res, employeeDTOs);
        }
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error getting employees by district:', error);
      return this.internalError(res, 'Failed to retrieve employees');
    }
  }
}