/**
 * Group Domain Entity
 * Represents groups of employees for organized broadcasting
 */

export enum GroupType {
  STATIC = 'static',
  DYNAMIC = 'dynamic',
  DEPARTMENT = 'department',
  DISTRICT = 'district',
  CUSTOM = 'custom'
}

export interface GroupMember {
  employeeId: string;
  name: string;
  phoneNumber: string;
  addedAt: Date;
  addedBy: string;
}

export interface GroupProps {
  id?: string;
  name: string;
  description?: string;
  type: GroupType;
  members: GroupMember[];
  departmentIds?: string[];
  districtIds?: string[];
  createdBy: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Group {
  private readonly _id?: string;
  private _name: string;
  private _description?: string;
  private _type: GroupType;
  private _members: GroupMember[];
  private _departmentIds?: string[];
  private _districtIds?: string[];
  private _createdBy: string;
  private _isActive: boolean;
  private _metadata?: Record<string, any>;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: GroupProps) {
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
  get id(): string | undefined {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | undefined {
    return this._description;
  }

  get type(): GroupType {
    return this._type;
  }

  get members(): GroupMember[] {
    return this._members;
  }

  get memberCount(): number {
    return this._members.length;
  }

  get departmentIds(): string[] | undefined {
    return this._departmentIds;
  }

  get districtIds(): string[] | undefined {
    return this._districtIds;
  }

  get createdBy(): string {
    return this._createdBy;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get metadata(): Record<string, any> | undefined {
    return this._metadata;
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
      throw new Error('Group name cannot be empty');
    }
    this._name = name;
    this.updateTimestamp();
  }

  updateDescription(description: string | undefined): void {
    this._description = description;
    this.updateTimestamp();
  }

  addMember(member: GroupMember): void {
    // Check if member already exists
    const exists = this._members.some(m => m.employeeId === member.employeeId);
    if (exists) {
      throw new Error(`Member with ID ${member.employeeId} already exists in the group`);
    }
    
    this._members.push(member);
    this.updateTimestamp();
  }

  removeMember(employeeId: string): void {
    const index = this._members.findIndex(m => m.employeeId === employeeId);
    if (index === -1) {
      throw new Error(`Member with ID ${employeeId} not found in the group`);
    }
    
    this._members.splice(index, 1);
    this.updateTimestamp();
  }

  updateMember(employeeId: string, updates: Partial<GroupMember>): void {
    const member = this._members.find(m => m.employeeId === employeeId);
    if (!member) {
      throw new Error(`Member with ID ${employeeId} not found in the group`);
    }
    
    Object.assign(member, updates);
    this.updateTimestamp();
  }

  hasMember(employeeId: string): boolean {
    return this._members.some(m => m.employeeId === employeeId);
  }

  getMember(employeeId: string): GroupMember | undefined {
    return this._members.find(m => m.employeeId === employeeId);
  }

  clearMembers(): void {
    this._members = [];
    this.updateTimestamp();
  }

  addDepartment(departmentId: string): void {
    if (!this._departmentIds) {
      this._departmentIds = [];
    }
    if (!this._departmentIds.includes(departmentId)) {
      this._departmentIds.push(departmentId);
      this.updateTimestamp();
    }
  }

  removeDepartment(departmentId: string): void {
    if (this._departmentIds) {
      const index = this._departmentIds.indexOf(departmentId);
      if (index > -1) {
        this._departmentIds.splice(index, 1);
        this.updateTimestamp();
      }
    }
  }

  addDistrict(districtId: string): void {
    if (!this._districtIds) {
      this._districtIds = [];
    }
    if (!this._districtIds.includes(districtId)) {
      this._districtIds.push(districtId);
      this.updateTimestamp();
    }
  }

  removeDistrict(districtId: string): void {
    if (this._districtIds) {
      const index = this._districtIds.indexOf(districtId);
      if (index > -1) {
        this._districtIds.splice(index, 1);
        this.updateTimestamp();
      }
    }
  }

  activate(): void {
    this._isActive = true;
    this.updateTimestamp();
  }

  deactivate(): void {
    this._isActive = false;
    this.updateTimestamp();
  }

  updateMetadata(key: string, value: any): void {
    if (!this._metadata) {
      this._metadata = {};
    }
    this._metadata[key] = value;
    this.updateTimestamp();
  }

  // Validation
  private validateProps(props: GroupProps): void {
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

  private updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  // Business rules
  isDynamic(): boolean {
    return this._type === GroupType.DYNAMIC || 
           this._type === GroupType.DEPARTMENT || 
           this._type === GroupType.DISTRICT;
  }

  isStatic(): boolean {
    return this._type === GroupType.STATIC;
  }

  canAddMembers(): boolean {
    return this._type === GroupType.STATIC || this._type === GroupType.CUSTOM;
  }

  isEmpty(): boolean {
    return this._members.length === 0 && 
           (!this._departmentIds || this._departmentIds.length === 0) &&
           (!this._districtIds || this._districtIds.length === 0);
  }

  getPhoneNumbers(): string[] {
    return this._members.map(m => m.phoneNumber);
  }

  // Factory method
  static create(props: GroupProps): Group {
    return new Group(props);
  }

  // Convert to plain object
  toObject(): GroupProps {
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