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

export class Department {
  private readonly _id?: string;
  private _name: string;
  private _code: string;
  private _description?: string;
  private _parentId?: string;
  private _level: number;
  private _order?: number;
  private _isActive: boolean;
  private _employeeCount: number;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: DepartmentProps) {
    this.validateProps(props);
    
    this._id = props.id;
    this._name = props.name;
    this._code = props.code.toUpperCase();
    this._description = props.description;
    this._parentId = props.parentId;
    this._level = props.level;
    this._order = props.order;
    this._isActive = props.isActive ?? true;
    this._employeeCount = props.employeeCount ?? 0;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // Getters
  get id(): string | undefined {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get code(): string {
    return this._code;
  }

  get description(): string | undefined {
    return this._description;
  }

  get parentId(): string | undefined {
    return this._parentId;
  }

  get level(): number {
    return this._level;
  }

  get order(): number | undefined {
    return this._order;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get employeeCount(): number {
    return this._employeeCount;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business methods
  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Department name cannot be empty');
    }
    this._name = name;
    this.updateTimestamp();
  }

  updateCode(code: string): void {
    if (!code || code.trim().length === 0) {
      throw new Error('Department code cannot be empty');
    }
    this._code = code.toUpperCase();
    this.updateTimestamp();
  }

  updateDescription(description: string | undefined): void {
    this._description = description;
    this.updateTimestamp();
  }

  setParent(parentId: string | undefined): void {
    this._parentId = parentId;
    this.updateTimestamp();
  }

  updateLevel(level: number): void {
    if (level < 0) {
      throw new Error('Department level cannot be negative');
    }
    this._level = level;
    this.updateTimestamp();
  }

  updateOrder(order: number | undefined): void {
    this._order = order;
    this.updateTimestamp();
  }

  incrementEmployeeCount(): void {
    this._employeeCount++;
    this.updateTimestamp();
  }

  decrementEmployeeCount(): void {
    if (this._employeeCount > 0) {
      this._employeeCount--;
      this.updateTimestamp();
    }
  }

  setEmployeeCount(count: number): void {
    if (count < 0) {
      throw new Error('Employee count cannot be negative');
    }
    this._employeeCount = count;
    this.updateTimestamp();
  }

  activate(): void {
    this._isActive = true;
    this.updateTimestamp();
  }

  deactivate(): void {
    this._isActive = false;
    this.updateTimestamp();
  }

  // Validation
  private validateProps(props: DepartmentProps): void {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Department name is required');
    }
    if (!props.code || props.code.trim().length === 0) {
      throw new Error('Department code is required');
    }
    if (props.level < 0) {
      throw new Error('Department level cannot be negative');
    }
  }

  private updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  // Business rules
  isRootDepartment(): boolean {
    return this._level === 0 && !this._parentId;
  }

  canHaveChildren(): boolean {
    return this._level < 3; // Maximum 3 levels of hierarchy
  }

  // Factory method
  static create(props: DepartmentProps): Department {
    return new Department(props);
  }

  // Convert to plain object
  toObject(): DepartmentProps {
    return {
      id: this._id,
      name: this._name,
      code: this._code,
      description: this._description,
      parentId: this._parentId,
      level: this._level,
      order: this._order,
      isActive: this._isActive,
      employeeCount: this._employeeCount,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}