"use strict";
/**
 * Group Domain Entity
 * Represents groups of employees for organized broadcasting
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Group = exports.GroupType = void 0;
var GroupType;
(function (GroupType) {
    GroupType["STATIC"] = "static";
    GroupType["DYNAMIC"] = "dynamic";
    GroupType["DEPARTMENT"] = "department";
    GroupType["DISTRICT"] = "district";
    GroupType["CUSTOM"] = "custom";
})(GroupType || (exports.GroupType = GroupType = {}));
class Group {
    _id;
    _name;
    _description;
    _type;
    _members;
    _departmentIds;
    _districtIds;
    _createdBy;
    _isActive;
    _metadata;
    _createdAt;
    _updatedAt;
    constructor(props) {
        this.validateProps(props);
        this._id = props.id;
        this._name = props.name;
        this._description = props.description;
        this._type = props.type;
        this._members = props.members;
        this._departmentIds = props.departmentIds;
        this._districtIds = props.districtIds;
        this._createdBy = props.createdBy;
        this._isActive = props.isActive ?? true;
        this._metadata = props.metadata;
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
    get description() {
        return this._description;
    }
    get type() {
        return this._type;
    }
    get members() {
        return this._members;
    }
    get memberCount() {
        return this._members.length;
    }
    get departmentIds() {
        return this._departmentIds;
    }
    get districtIds() {
        return this._districtIds;
    }
    get createdBy() {
        return this._createdBy;
    }
    get isActive() {
        return this._isActive;
    }
    get metadata() {
        return this._metadata;
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
            throw new Error('Group name cannot be empty');
        }
        this._name = name;
        this.updateTimestamp();
    }
    updateDescription(description) {
        this._description = description;
        this.updateTimestamp();
    }
    addMember(member) {
        // Check if member already exists
        const exists = this._members.some(m => m.employeeId === member.employeeId);
        if (exists) {
            throw new Error(`Member with ID ${member.employeeId} already exists in the group`);
        }
        this._members.push(member);
        this.updateTimestamp();
    }
    removeMember(employeeId) {
        const index = this._members.findIndex(m => m.employeeId === employeeId);
        if (index === -1) {
            throw new Error(`Member with ID ${employeeId} not found in the group`);
        }
        this._members.splice(index, 1);
        this.updateTimestamp();
    }
    updateMember(employeeId, updates) {
        const member = this._members.find(m => m.employeeId === employeeId);
        if (!member) {
            throw new Error(`Member with ID ${employeeId} not found in the group`);
        }
        Object.assign(member, updates);
        this.updateTimestamp();
    }
    hasMember(employeeId) {
        return this._members.some(m => m.employeeId === employeeId);
    }
    getMember(employeeId) {
        return this._members.find(m => m.employeeId === employeeId);
    }
    clearMembers() {
        this._members = [];
        this.updateTimestamp();
    }
    addDepartment(departmentId) {
        if (!this._departmentIds) {
            this._departmentIds = [];
        }
        if (!this._departmentIds.includes(departmentId)) {
            this._departmentIds.push(departmentId);
            this.updateTimestamp();
        }
    }
    removeDepartment(departmentId) {
        if (this._departmentIds) {
            const index = this._departmentIds.indexOf(departmentId);
            if (index > -1) {
                this._departmentIds.splice(index, 1);
                this.updateTimestamp();
            }
        }
    }
    addDistrict(districtId) {
        if (!this._districtIds) {
            this._districtIds = [];
        }
        if (!this._districtIds.includes(districtId)) {
            this._districtIds.push(districtId);
            this.updateTimestamp();
        }
    }
    removeDistrict(districtId) {
        if (this._districtIds) {
            const index = this._districtIds.indexOf(districtId);
            if (index > -1) {
                this._districtIds.splice(index, 1);
                this.updateTimestamp();
            }
        }
    }
    activate() {
        this._isActive = true;
        this.updateTimestamp();
    }
    deactivate() {
        this._isActive = false;
        this.updateTimestamp();
    }
    updateMetadata(key, value) {
        if (!this._metadata) {
            this._metadata = {};
        }
        this._metadata[key] = value;
        this.updateTimestamp();
    }
    // Validation
    validateProps(props) {
        if (!props.name || props.name.trim().length === 0) {
            throw new Error('Group name is required');
        }
        if (!props.createdBy) {
            throw new Error('Group creator is required');
        }
        if (props.type === GroupType.STATIC && (!props.members || props.members.length === 0)) {
            throw new Error('Static groups must have at least one member');
        }
        if (props.type === GroupType.DEPARTMENT && (!props.departmentIds || props.departmentIds.length === 0)) {
            throw new Error('Department groups must have at least one department');
        }
        if (props.type === GroupType.DISTRICT && (!props.districtIds || props.districtIds.length === 0)) {
            throw new Error('District groups must have at least one district');
        }
    }
    updateTimestamp() {
        this._updatedAt = new Date();
    }
    // Business rules
    isDynamic() {
        return this._type === GroupType.DYNAMIC ||
            this._type === GroupType.DEPARTMENT ||
            this._type === GroupType.DISTRICT;
    }
    isStatic() {
        return this._type === GroupType.STATIC;
    }
    canAddMembers() {
        return this._type === GroupType.STATIC || this._type === GroupType.CUSTOM;
    }
    isEmpty() {
        return this._members.length === 0 &&
            (!this._departmentIds || this._departmentIds.length === 0) &&
            (!this._districtIds || this._districtIds.length === 0);
    }
    getPhoneNumbers() {
        return this._members.map(m => m.phoneNumber);
    }
    // Factory method
    static create(props) {
        return new Group(props);
    }
    // Convert to plain object
    toObject() {
        return {
            id: this._id,
            name: this._name,
            description: this._description,
            type: this._type,
            members: this._members.map(m => ({ ...m })),
            departmentIds: this._departmentIds ? [...this._departmentIds] : undefined,
            districtIds: this._districtIds ? [...this._districtIds] : undefined,
            createdBy: this._createdBy,
            isActive: this._isActive,
            metadata: this._metadata ? { ...this._metadata } : undefined,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
        };
    }
}
exports.Group = Group;
//# sourceMappingURL=Group.js.map