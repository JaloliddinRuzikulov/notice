/**
 * User Repository Interface
 * Domain layer repository contract for User entity
 */
import { User, UserRole, UserStatus } from '../entities/User';
export interface UserSearchCriteria {
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    status?: UserStatus;
    district?: string;
    department?: string;
}
export interface IUserRepository {
    findById(id: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    save(user: User): Promise<User>;
    update(id: string, user: Partial<User>): Promise<User | null>;
    delete(id: string): Promise<boolean>;
    findByCredentials(username: string, passwordHash: string): Promise<User | null>;
    updateLastLogin(id: string, ipAddress: string): Promise<boolean>;
    updatePassword(id: string, passwordHash: string): Promise<boolean>;
    recordFailedLogin(id: string): Promise<boolean>;
    resetFailedLoginAttempts(id: string): Promise<boolean>;
    findByRole(role: UserRole): Promise<User[]>;
    findByPermission(permission: string): Promise<User[]>;
    updateRole(id: string, role: UserRole): Promise<boolean>;
    addPermission(id: string, permission: string): Promise<boolean>;
    removePermission(id: string, permission: string): Promise<boolean>;
    findByStatus(status: UserStatus): Promise<User[]>;
    activate(id: string): Promise<boolean>;
    deactivate(id: string): Promise<boolean>;
    suspend(id: string, until?: Date): Promise<boolean>;
    unlock(id: string): Promise<boolean>;
    findByDistrict(district: string): Promise<User[]>;
    findByDepartment(department: string): Promise<User[]>;
    updateDistrict(id: string, district: string): Promise<boolean>;
    updateDepartment(id: string, department: string): Promise<boolean>;
    search(criteria: UserSearchCriteria): Promise<User[]>;
    findActiveUsers(): Promise<User[]>;
    findInactiveUsers(): Promise<User[]>;
    findLockedUsers(): Promise<User[]>;
    countByRole(): Promise<Record<string, number>>;
    countByStatus(): Promise<Record<string, number>>;
    countByDistrict(): Promise<Record<string, number>>;
    countTotal(): Promise<number>;
    countActive(): Promise<number>;
    findActiveSession(userId: string): Promise<any>;
    createSession(userId: string, sessionData: any): Promise<string>;
    deleteSession(sessionId: string): Promise<boolean>;
    deleteUserSessions(userId: string): Promise<number>;
    exists(id: string): Promise<boolean>;
    existsByUsername(username: string): Promise<boolean>;
    existsByEmail(email: string): Promise<boolean>;
}
//# sourceMappingURL=IUserRepository.d.ts.map