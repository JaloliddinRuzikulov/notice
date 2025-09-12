/**
 * Department Domain Entity
 * Represents organizational departments in the police structure
 */
export interface DepartmentProps {
    id?: string;
    name: string;
    code: string;
    description?: string;
    parentId?: string;
    level: number;
    order?: number;
    isActive: boolean;
    employeeCount?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class Department {
    private readonly _id?;
    private _name;
    private _code;
    private _description?;
    private _parentId?;
    private _level;
    private _order?;
    private _isActive;
    private _employeeCount;
    private readonly _createdAt;
    private _updatedAt;
    constructor(props: DepartmentProps);
    get id(): string | undefined;
    get name(): string;
    get code(): string;
    get description(): string | undefined;
    get parentId(): string | undefined;
    get level(): number;
    get order(): number | undefined;
    get isActive(): boolean;
    get employeeCount(): number;
    get createdAt(): Date;
    get updatedAt(): Date;
    updateName(name: string): void;
    updateCode(code: string): void;
    updateDescription(description: string | undefined): void;
    setParent(parentId: string | undefined): void;
    updateLevel(level: number): void;
    updateOrder(order: number | undefined): void;
    incrementEmployeeCount(): void;
    decrementEmployeeCount(): void;
    setEmployeeCount(count: number): void;
    activate(): void;
    deactivate(): void;
    private validateProps;
    private updateTimestamp;
    isRootDepartment(): boolean;
    canHaveChildren(): boolean;
    static create(props: DepartmentProps): Department;
    toObject(): DepartmentProps;
}
//# sourceMappingURL=Department.d.ts.map