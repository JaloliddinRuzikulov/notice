/**
 * Department Repository Interface
 * Domain layer repository contract for Department entity
 */
import { Department } from '../entities/Department';
export interface IDepartmentRepository {
    findById(id: string): Promise<Department | null>;
    findByCode(code: string): Promise<Department | null>;
    findByName(name: string): Promise<Department | null>;
    findAll(): Promise<Department[]>;
    save(department: Department): Promise<Department>;
    update(id: string, department: Partial<Department>): Promise<Department | null>;
    delete(id: string): Promise<boolean>;
    findByParent(parentId: string): Promise<Department[]>;
    findChildren(parentId: string): Promise<Department[]>;
    findRootDepartments(): Promise<Department[]>;
    findByLevel(level: number): Promise<Department[]>;
    getHierarchy(): Promise<Department[]>;
    updateParent(id: string, parentId: string | null): Promise<boolean>;
    findActive(): Promise<Department[]>;
    findInactive(): Promise<Department[]>;
    activate(id: string): Promise<boolean>;
    deactivate(id: string): Promise<boolean>;
    updateEmployeeCount(id: string, count: number): Promise<boolean>;
    incrementEmployeeCount(id: string): Promise<boolean>;
    decrementEmployeeCount(id: string): Promise<boolean>;
    recalculateEmployeeCount(id: string): Promise<number>;
    countTotal(): Promise<number>;
    countActive(): Promise<number>;
    countByLevel(): Promise<Record<number, number>>;
    getEmployeeCountStatistics(): Promise<any>;
    exists(id: string): Promise<boolean>;
    existsByCode(code: string): Promise<boolean>;
    existsByName(name: string): Promise<boolean>;
    hasChildren(id: string): Promise<boolean>;
}
//# sourceMappingURL=IDepartmentRepository.d.ts.map