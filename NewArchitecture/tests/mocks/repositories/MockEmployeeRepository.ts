/**
 * Mock Employee Repository for Testing
 */

import { Employee } from '@/core/domain/entities/Employee';
import { IEmployeeRepository } from '@/core/domain/repositories/IEmployeeRepository';

export class MockEmployeeRepository implements IEmployeeRepository {
  private employees: Employee[] = [];
  private nextId = 1;

  async findById(id: string): Promise<Employee | null> {
    return this.employees.find(emp => emp.id === id) || null;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Employee | null> {
    return this.employees.find(emp => emp.phoneNumber === phoneNumber) || null;
  }

  async findAll(): Promise<Employee[]> {
    return [...this.employees];
  }

  async findByDepartment(departmentId: string): Promise<Employee[]> {
    return this.employees.filter(emp => emp.department === departmentId);
  }

  async findByDistrict(districtId: string): Promise<Employee[]> {
    return this.employees.filter(emp => emp.district === districtId);
  }

  async save(employee: Employee): Promise<Employee> {
    const index = this.employees.findIndex(emp => emp.id === employee.id);
    if (index >= 0) {
      this.employees[index] = employee;
    } else {
      // Set ID if not present
      if (!employee.id) {
        (employee as any)._id = this.nextId.toString();
        this.nextId++;
      }
      this.employees.push(employee);
    }
    return employee;
  }

  async update(id: string, employee: Partial<Employee>): Promise<Employee | null> {
    const existing = this.employees.find(emp => emp.id === id);
    if (!existing) return null;
    Object.assign(existing, employee);
    return existing;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.employees.findIndex(emp => emp.id === id);
    if (index >= 0) {
      this.employees.splice(index, 1);
      return true;
    }
    return false;
  }

  async count(): Promise<number> {
    return this.employees.length;
  }

  async search(criteria: any): Promise<Employee[]> {
    let results = [...this.employees];
    if (criteria.firstName) {
      results = results.filter(emp => emp.firstName.includes(criteria.firstName));
    }
    if (criteria.lastName) {
      results = results.filter(emp => emp.lastName.includes(criteria.lastName));
    }
    if (criteria.department) {
      results = results.filter(emp => emp.department === criteria.department);
    }
    if (criteria.district) {
      results = results.filter(emp => emp.district === criteria.district);
    }
    return results;
  }

  async findByDepartmentAndDistrict(departmentId: string, districtId: string): Promise<Employee[]> {
    return this.employees.filter(emp => 
      emp.department === departmentId && emp.district === districtId
    );
  }

  async findPaginated(options: any): Promise<any> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;
    return {
      data: this.employees.slice(offset, offset + limit),
      total: this.employees.length,
      page,
      limit,
      totalPages: Math.ceil(this.employees.length / limit)
    };
  }

  async findActive(): Promise<Employee[]> {
    return this.employees.filter(emp => emp.isActive);
  }

  async findInactive(): Promise<Employee[]> {
    return this.employees.filter(emp => !emp.isActive);
  }

  async exists(id: string): Promise<boolean> {
    return this.employees.some(emp => emp.id === id);
  }

  async existsByPhoneNumber(phoneNumber: string): Promise<boolean> {
    return this.employees.some(emp => emp.phoneNumber === phoneNumber);
  }

  async activate(id: string): Promise<boolean> {
    const employee = this.employees.find(emp => emp.id === id);
    if (employee) {
      employee.activate();
      return true;
    }
    return false;
  }

  async deactivate(id: string): Promise<boolean> {
    const employee = this.employees.find(emp => emp.id === id);
    if (employee) {
      employee.deactivate();
      return true;
    }
    return false;
  }

  async countByDepartment(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    this.employees.forEach(emp => {
      if (emp.department) {
        counts[emp.department] = (counts[emp.department] || 0) + 1;
      }
    });
    return counts;
  }

  async countByDistrict(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    this.employees.forEach(emp => {
      if (emp.district) {
        counts[emp.district] = (counts[emp.district] || 0) + 1;
      }
    });
    return counts;
  }

  async countActive(): Promise<number> {
    return this.employees.filter(emp => emp.isActive).length;
  }

  async countInactive(): Promise<number> {
    return this.employees.filter(emp => !emp.isActive).length;
  }

  async saveMany(employees: Employee[]): Promise<Employee[]> {
    const saved: Employee[] = [];
    for (const employee of employees) {
      saved.push(await this.save(employee));
    }
    return saved;
  }

  async updateMany(updates: { id: string; data: Partial<Employee> }[]): Promise<number> {
    let updated = 0;
    for (const { id, data } of updates) {
      const result = await this.update(id, data);
      if (result) updated++;
    }
    return updated;
  }

  async deleteMany(ids: string[]): Promise<number> {
    let deleted = 0;
    for (const id of ids) {
      if (await this.delete(id)) deleted++;
    }
    return deleted;
  }

  async findWithPagination(offset: number, limit: number): Promise<Employee[]> {
    return this.employees.slice(offset, offset + limit);
  }

  async searchPaginated(criteria: any, options: any): Promise<{ data: Employee[]; total: number; page: number; totalPages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    let results = await this.search(criteria);
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(results.length / limit);
    return {
      data: results.slice(offset, offset + limit),
      total: results.length,
      page,
      totalPages
    };
  }

  async countTotal(): Promise<number> {
    return this.employees.length;
  }

  async findActiveEmployees(): Promise<Employee[]> {
    return this.findActive();
  }

  async findInactiveEmployees(): Promise<Employee[]> {
    return this.findInactive();
  }

  async updateEmployeeStatus(id: string, isActive: boolean): Promise<boolean> {
    if (isActive) {
      return this.activate(id);
    } else {
      return this.deactivate(id);
    }
  }

  async bulkUpdateDepartment(employeeIds: string[], departmentId: string): Promise<number> {
    let updated = 0;
    for (const id of employeeIds) {
      const employee = this.employees.find(emp => emp.id === id);
      if (employee) {
        employee.updateDepartment(departmentId);
        updated++;
      }
    }
    return updated;
  }

  async activateEmployee(id: string): Promise<boolean> {
    return this.activate(id);
  }

  async deactivateEmployee(id: string): Promise<boolean> {
    return this.deactivate(id);
  }

  // Test helper methods
  clear(): void {
    this.employees = [];
    this.nextId = 1;
  }

  addEmployee(employee: Employee): void {
    this.employees.push(employee);
  }
}