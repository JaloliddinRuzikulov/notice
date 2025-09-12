"use strict";
/**
 * Department Domain Entity
 * Represents organizational departments in the police structure
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Department = void 0;
class Department {
    _id;
    _name;
    _code;
    _description;
    _parentId;
    _level;
    _order;
    _isActive;
    _employeeCount;
    _createdAt;
    _updatedAt;
    constructor(props) {
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
    get id() {
        return this._id;
    }
    get name() {
        return this._name;
    }
    get code() {
        return this._code;
    }
    get description() {
        return this._description;
    }
    get parentId() {
        return this._parentId;
    }
    get level() {
        return this._level;
    }
    get order() {
        return this._order;
    }
    get isActive() {
        return this._isActive;
    }
    get employeeCount() {
        return this._employeeCount;
    }
    get createdAt() {
        return this._createdAt;
    }
    get updatedAt() {
        return this._updatedAt;
    }
    // Business methods
    updateName(name) {
        if (!name || name.trim().length === 0) {
            throw new Error('Department name cannot be empty');
        }
        this._name = name;
        this.updateTimestamp();
    }
    updateCode(code) {
        if (!code || code.trim().length === 0) {
            throw new Error('Department code cannot be empty');
        }
        this._code = code.toUpperCase();
        this.updateTimestamp();
    }
    updateDescription(description) {
        this._description = description;
        this.updateTimestamp();
    }
    setParent(parentId) {
        this._parentId = parentId;
        this.updateTimestamp();
    }
    updateLevel(level) {
        if (level < 0) {
            throw new Error('Department level cannot be negative');
        }
        this._level = level;
        this.updateTimestamp();
    }
    updateOrder(order) {
        this._order = order;
        this.updateTimestamp();
    }
    incrementEmployeeCount() {
        this._employeeCount++;
        this.updateTimestamp();
    }
    decrementEmployeeCount() {
        if (this._employeeCount > 0) {
            this._employeeCount--;
            this.updateTimestamp();
        }
    }
    setEmployeeCount(count) {
        if (count < 0) {
            throw new Error('Employee count cannot be negative');
        }
        this._employeeCount = count;
        this.updateTimestamp();
    }
    activate() {
        this._isActive = true;
        this.updateTimestamp();
    }
    deactivate() {
        this._isActive = false;
        this.updateTimestamp();
    }
    // Validation
    validateProps(props) {
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
    updateTimestamp() {
        this._updatedAt = new Date();
    }
    // Business rules
    isRootDepartment() {
        return this._level === 0 && !this._parentId;
    }
    canHaveChildren() {
        return this._level < 3; // Maximum 3 levels of hierarchy
    }
    // Factory method
    static create(props) {
        return new Department(props);
    }
    // Convert to plain object
    toObject() {
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
exports.Department = Department;
//# sourceMappingURL=Department.js.map