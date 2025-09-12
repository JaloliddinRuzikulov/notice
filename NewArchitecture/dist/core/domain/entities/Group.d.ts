/**
 * Group Domain Entity
 * Represents groups of employees for organized broadcasting
 */
export declare enum GroupType {
    STATIC = "static",
    DYNAMIC = "dynamic",
    DEPARTMENT = "department",
    DISTRICT = "district",
    CUSTOM = "custom"
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
export declare class Group {
    private readonly _id?;
    private _name;
    private _description?;
    private _type;
    private _members;
    private _departmentIds?;
    private _districtIds?;
    private _createdBy;
    private _isActive;
    private _metadata?;
    private readonly _createdAt;
    private _updatedAt;
    constructor(props: GroupProps);
    get id(): string | undefined;
    get name(): string;
    get description(): string | undefined;
    get type(): GroupType;
    get members(): GroupMember[];
    get memberCount(): number;
    get departmentIds(): string[] | undefined;
    get districtIds(): string[] | undefined;
    get createdBy(): string;
    get isActive(): boolean;
    get metadata(): Record<string, any> | undefined;
    get createdAt(): Date;
    get updatedAt(): Date;
    updateName(name: string): void;
    updateDescription(description: string | undefined): void;
    addMember(member: GroupMember): void;
    removeMember(employeeId: string): void;
    updateMember(employeeId: string, updates: Partial<GroupMember>): void;
    hasMember(employeeId: string): boolean;
    getMember(employeeId: string): GroupMember | undefined;
    clearMembers(): void;
    addDepartment(departmentId: string): void;
    removeDepartment(departmentId: string): void;
    addDistrict(districtId: string): void;
    removeDistrict(districtId: string): void;
    activate(): void;
    deactivate(): void;
    updateMetadata(key: string, value: any): void;
    private validateProps;
    private updateTimestamp;
    isDynamic(): boolean;
    isStatic(): boolean;
    canAddMembers(): boolean;
    isEmpty(): boolean;
    getPhoneNumbers(): string[];
    static create(props: GroupProps): Group;
    toObject(): GroupProps;
}
//# sourceMappingURL=Group.d.ts.map