/**
 * Group Repository Interface
 * Domain layer repository contract for Group entity
 */
import { Group, GroupType } from '../entities/Group';
export interface GroupSearchCriteria {
    name?: string;
    type?: GroupType;
    departmentId?: string;
    districtId?: string;
    createdBy?: string;
    isActive?: boolean;
}
export interface IGroupRepository {
    findById(id: string): Promise<Group | null>;
    findByName(name: string): Promise<Group | null>;
    findAll(): Promise<Group[]>;
    save(group: Group): Promise<Group>;
    update(id: string, group: Partial<Group>): Promise<Group | null>;
    delete(id: string): Promise<boolean>;
    findByType(type: GroupType): Promise<Group[]>;
    findStaticGroups(): Promise<Group[]>;
    findDynamicGroups(): Promise<Group[]>;
    findDepartmentGroups(): Promise<Group[]>;
    findDistrictGroups(): Promise<Group[]>;
    findCustomGroups(): Promise<Group[]>;
    addMember(groupId: string, member: any): Promise<boolean>;
    removeMember(groupId: string, employeeId: string): Promise<boolean>;
    updateMember(groupId: string, employeeId: string, data: any): Promise<boolean>;
    getMembers(groupId: string): Promise<any[]>;
    getMemberCount(groupId: string): Promise<number>;
    clearMembers(groupId: string): Promise<boolean>;
    findByDepartment(departmentId: string): Promise<Group[]>;
    findByDistrict(districtId: string): Promise<Group[]>;
    addDepartment(groupId: string, departmentId: string): Promise<boolean>;
    removeDepartment(groupId: string, departmentId: string): Promise<boolean>;
    addDistrict(groupId: string, districtId: string): Promise<boolean>;
    removeDistrict(groupId: string, districtId: string): Promise<boolean>;
    search(criteria: GroupSearchCriteria): Promise<Group[]>;
    findByCreator(userId: string): Promise<Group[]>;
    findActive(): Promise<Group[]>;
    findInactive(): Promise<Group[]>;
    findWithMembers(): Promise<Group[]>;
    findEmpty(): Promise<Group[]>;
    findGroupsByMember(employeeId: string): Promise<Group[]>;
    isMemberOf(employeeId: string, groupId: string): Promise<boolean>;
    getMemberGroups(employeeId: string): Promise<Group[]>;
    activate(id: string): Promise<boolean>;
    deactivate(id: string): Promise<boolean>;
    addMembersToGroup(groupId: string, memberIds: string[]): Promise<number>;
    removeMembersFromGroup(groupId: string, memberIds: string[]): Promise<number>;
    deleteMany(ids: string[]): Promise<number>;
    countByType(): Promise<Record<string, number>>;
    countMembers(groupId: string): Promise<number>;
    countActive(): Promise<number>;
    countTotal(): Promise<number>;
    getMembershipStatistics(): Promise<any>;
    exists(id: string): Promise<boolean>;
    existsByName(name: string): Promise<boolean>;
    hasMember(groupId: string, employeeId: string): Promise<boolean>;
}
//# sourceMappingURL=IGroupRepository.d.ts.map