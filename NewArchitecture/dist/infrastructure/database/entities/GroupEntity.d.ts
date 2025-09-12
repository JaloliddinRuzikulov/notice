/**
 * Group Entity for TypeORM
 */
export declare enum GroupTypeDB {
    STATIC = "static",
    DYNAMIC = "dynamic",
    DEPARTMENT = "department",
    DISTRICT = "district",
    CUSTOM = "custom"
}
export declare class GroupEntity {
    id: string;
    name: string;
    description?: string;
    type: GroupTypeDB;
    members: Array<{
        employeeId: string;
        name: string;
        phoneNumber: string;
        addedAt: Date;
        addedBy: string;
    }>;
    departmentIds?: string[];
    districtIds?: string[];
    createdBy: string;
    isActive: boolean;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=GroupEntity.d.ts.map