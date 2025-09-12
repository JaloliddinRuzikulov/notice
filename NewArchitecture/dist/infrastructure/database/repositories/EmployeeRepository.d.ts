/**
 * Employee Repository Implementation
 * Concrete implementation of IEmployeeRepository
 */
import { IEmployeeRepository, EmployeeSearchCriteria, PaginationOptions, PaginatedResult } from '@/core/domain/repositories/IEmployeeRepository';
import { Employee } from '@/core/domain/entities/Employee';
export declare class EmployeeRepository implements IEmployeeRepository {
    private repository;
    constructor();
    private toDomainModel;
    private toEntity;
    findById(id: string): Promise<Employee | null>;
    findByPhoneNumber(phoneNumber: string): Promise<Employee | null>;
    findAll(): Promise<Employee[]>;
    save(employee: Employee): Promise<Employee>;
    update(id: string, employee: Partial<Employee>): Promise<Employee | null>;
    search(criteria: EmployeeSearchCriteria): Promise<Employee[]>;
    findByDepartment(department: string): Promise<Employee[]>;
    findByDistrict(district: string): Promise<Employee[]>;
    findByDepartmentAndDistrict(department: string, district: string): Promise<Employee[]>;
    findPaginated(options: PaginationOptions): Promise<PaginatedResult<Employee>>;
    searchPaginated(criteria: EmployeeSearchCriteria, options: PaginationOptions): Promise<PaginatedResult<Employee>>;
    saveMany(employees: Employee[]): Promise<Employee[]>;
    updateMany(updates: Array<{
        id: string;
        data: Partial<Employee>;
    }>): Promise<number>;
    countByDepartment(): Promise<Record<string, number>>;
    countByDistrict(): Promise<Record<string, number>>;
    countActive(): Promise<number>;
    countTotal(): Promise<number>;
    findActiveEmployees(): Promise<Employee[]>;
    findInactiveEmployees(): Promise<Employee[]>;
    activateEmployee(id: string): Promise<boolean>;
    deactivateEmployee(id: string): Promise<boolean>;
    exists(id: string): Promise<boolean>;
    existsByPhoneNumber(phoneNumber: string): Promise<boolean>;
    delete(id: string): Promise<boolean>;
    deleteMany(ids: string[]): Promise<number>;
}
//# sourceMappingURL=EmployeeRepository.d.ts.map