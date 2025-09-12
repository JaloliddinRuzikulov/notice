/**
 * Mock User Repository for Testing
 */

import { User, UserStatus } from '@/core/domain/entities/User';
import { IUserRepository } from '@/core/domain/repositories/IUserRepository';

export class MockUserRepository implements IUserRepository {
  private users: User[] = [];
  private nextId = 1;

  async findById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.users.find(user => user.username === username) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(user => user.email === email) || null;
  }

  async findAll(): Promise<User[]> {
    return [...this.users];
  }

  async save(user: User): Promise<User> {
    const index = this.users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      this.users[index] = user;
    } else {
      // Set ID if not present
      if (!user.id) {
        (user as any)._id = this.nextId.toString();
        this.nextId++;
      }
      this.users.push(user);
    }
    return user;
  }

  async update(id: string, user: Partial<User>): Promise<User | null> {
    const existing = this.users.find(u => u.id === id);
    if (!existing) return null;
    Object.assign(existing, user);
    return existing;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.users.findIndex(user => user.id === id);
    if (index >= 0) {
      this.users.splice(index, 1);
      return true;
    }
    return false;
  }

  async recordFailedLogin(userId: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (user) {
      user.recordFailedLogin();
      await this.save(user);
      return true;
    }
    return false;
  }

  async recordSuccessfulLogin(id: string): Promise<void> {
    const user = await this.findById(id);
    if (user) {
      user.recordSuccessfulLogin('127.0.0.1');
      await this.save(user);
    }
  }

  async findByCredentials(username: string, _passwordHash: string): Promise<User | null> {
    return this.findByUsername(username);
  }

  async updateLastLogin(id: string, ipAddress?: string): Promise<boolean> {
    const user = await this.findById(id);
    if (user) {
      user.recordSuccessfulLogin(ipAddress || '127.0.0.1');
      await this.save(user);
      return true;
    }
    return false;
  }

  async updatePassword(id: string, passwordHash: string): Promise<boolean> {
    const user = await this.findById(id);
    if (user) {
      user.updatePassword(passwordHash);
      await this.save(user);
      return true;
    }
    return false;
  }

  async findByRole(role: string): Promise<User[]> {
    return this.users.filter(user => user.role === role);
  }

  async findActive(): Promise<User[]> {
    return this.users.filter(user => user.status === UserStatus.ACTIVE);
  }

  async findInactive(): Promise<User[]> {
    return this.users.filter(user => user.status === UserStatus.INACTIVE);
  }

  async exists(id: string): Promise<boolean> {
    return this.users.some(user => user.id === id);
  }

  async existsByUsername(username: string): Promise<boolean> {
    return this.users.some(user => user.username === username);
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.users.some(user => user.email === email);
  }

  async activate(id: string): Promise<boolean> {
    const user = await this.findById(id);
    if (user) {
      user.activate();
      await this.save(user);
      return true;
    }
    return false;
  }

  async deactivate(id: string): Promise<boolean> {
    const user = await this.findById(id);
    if (user) {
      user.deactivate();
      await this.save(user);
      return true;
    }
    return false;
  }

  async suspend(id: string): Promise<boolean> {
    const user = await this.findById(id);
    if (user) {
      user.suspend();
      await this.save(user);
      return true;
    }
    return false;
  }

  async unsuspend(id: string): Promise<boolean> {
    const user = await this.findById(id);
    if (user) {
      user.activate(); // Use activate instead of unsuspend
      await this.save(user);
      return true;
    }
    return false;
  }

  async updatePermissions(id: string, permissions: string[]): Promise<boolean> {
    const user = await this.findById(id);
    if (user) {
      permissions.forEach(p => user.addPermission(p));
      await this.save(user);
      return true;
    }
    return false;
  }

  async addPermission(id: string, permission: string): Promise<boolean> {
    const user = await this.findById(id);
    if (user) {
      user.addPermission(permission);
      await this.save(user);
      return true;
    }
    return false;
  }

  async removePermission(id: string, permission: string): Promise<boolean> {
    const user = await this.findById(id);
    if (user) {
      user.removePermission(permission);
      await this.save(user);
      return true;
    }
    return false;
  }

  async changeRole(id: string, role: string): Promise<boolean> {
    const user = await this.findById(id);
    if (user) {
      user.changeRole(role as any);
      await this.save(user);
      return true;
    }
    return false;
  }

  async resetFailedLoginAttempts(id: string): Promise<boolean> {
    const user = await this.findById(id);
    if (user) {
      // Reset failed attempts manually
      (user as any)._failedLoginAttempts = 0;
      (user as any)._lockedUntil = null;
      await this.save(user);
      return true;
    }
    return false;
  }

  async findByDepartment(department: string): Promise<User[]> {
    return this.users.filter(user => user.department === department);
  }

  async countTotal(): Promise<number> {
    return this.users.length;
  }

  async countActive(): Promise<number> {
    return this.users.filter(user => user.status === UserStatus.ACTIVE).length;
  }

  async countByRole(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    this.users.forEach(user => {
      counts[user.role] = (counts[user.role] || 0) + 1;
    });
    return counts;
  }

  async findWithExpiredSessions(): Promise<User[]> {
    // Mock implementation
    return [];
  }

  async cleanupExpiredSessions(): Promise<number> {
    // Mock implementation
    return 0;
  }

  async saveMany(users: User[]): Promise<User[]> {
    const saved: User[] = [];
    for (const user of users) {
      saved.push(await this.save(user));
    }
    return saved;
  }

  async updateMany(updates: { id: string; data: Partial<User> }[]): Promise<number> {
    let updated = 0;
    for (const { id, data } of updates) {
      const result = await this.update(id, data);
      if (result) updated++;
    }
    return updated;
  }

  async deleteMany(ids: string[]): Promise<number> {
    let deleted = 0;
    for (const id of ids) {
      if (await this.delete(id)) deleted++;
    }
    return deleted;
  }

  async findByPermission(permission: string): Promise<User[]> {
    return this.users.filter(user => user.permissions.includes(permission));
  }

  async updateRole(id: string, role: string): Promise<boolean> {
    return this.changeRole(id, role);
  }

  async findByStatus(status: string): Promise<User[]> {
    return this.users.filter(user => user.status === status);
  }

  async unlock(id: string): Promise<boolean> {
    const user = await this.findById(id);
    if (user) {
      user.unlock();
      await this.save(user);
      return true;
    }
    return false;
  }

  async lock(id: string): Promise<boolean> {
    const user = await this.findById(id);
    if (user) {
      // Lock for 30 minutes
      user.suspend(new Date(Date.now() + 30 * 60 * 1000));
      await this.save(user);
      return true;
    }
    return false;
  }

  async isLocked(id: string): Promise<boolean> {
    const user = await this.findById(id);
    return user ? user.isLocked() : false;
  }

  async updateEmail(id: string, email: string): Promise<boolean> {
    const user = await this.findById(id);
    if (user) {
      user.updateEmail(email);
      await this.save(user);
      return true;
    }
    return false;
  }

  async updateProfile(id: string, profile: any): Promise<boolean> {
    const user = await this.findById(id);
    if (user) {
      Object.assign(user, profile);
      await this.save(user);
      return true;
    }
    return false;
  }

  async findPaginated(page: number, limit: number): Promise<{ data: User[]; total: number }> {
    const offset = (page - 1) * limit;
    return {
      data: this.users.slice(offset, offset + limit),
      total: this.users.length
    };
  }

  async searchUsers(criteria: any): Promise<User[]> {
    let results = [...this.users];
    if (criteria.username) {
      results = results.filter(u => u.username.includes(criteria.username));
    }
    if (criteria.email) {
      results = results.filter(u => u.email && u.email.includes(criteria.email));
    }
    if (criteria.role) {
      results = results.filter(u => u.role === criteria.role);
    }
    return results;
  }

  async countByStatus(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    this.users.forEach(user => {
      counts[user.status] = (counts[user.status] || 0) + 1;
    });
    return counts;
  }

  async getLoginStatistics(userId: string): Promise<any> {
    const user = await this.findById(userId);
    if (!user) return null;
    return {
      lastLogin: user.lastLoginAt,
      failedAttempts: user.failedLoginAttempts,
      totalLogins: 0 // Mock value
    };
  }

  async findByDistrict(district: string): Promise<User[]> {
    return this.users.filter(user => user.district === district);
  }

  async updateDistrict(id: string, district: string): Promise<boolean> {
    const user = await this.findById(id);
    if (user) {
      (user as any).district = district;
      await this.save(user);
      return true;
    }
    return false;
  }

  async updateDepartment(id: string, department: string): Promise<boolean> {
    const user = await this.findById(id);
    if (user) {
      (user as any).department = department;
      await this.save(user);
      return true;
    }
    return false;
  }

  async search(criteria: any): Promise<User[]> {
    return this.searchUsers(criteria);
  }

  async createSession(_userId: string, _data: any): Promise<string> {
    // Mock session creation
    return `session-${_userId}-${Date.now()}`;
  }

  async destroySession(_sessionId: string): Promise<boolean> {
    // Mock session destruction
    return true;
  }

  async validateSession(_sessionId: string): Promise<boolean> {
    // Mock session validation
    return true;
  }

  async getActiveUsers(): Promise<User[]> {
    return this.findActive();
  }

  async getInactiveUsers(): Promise<User[]> {
    return this.findInactive();
  }

  async findWithPermission(permission: string): Promise<User[]> {
    return this.findByPermission(permission);
  }

  async countByDepartment(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    this.users.forEach(user => {
      if (user.department) {
        counts[user.department] = (counts[user.department] || 0) + 1;
      }
    });
    return counts;
  }

  async findActiveUsers(): Promise<User[]> {
    return this.findActive();
  }

  async findInactiveUsers(): Promise<User[]> {
    return this.findInactive();
  }

  async findLockedUsers(): Promise<User[]> {
    return this.users.filter(user => user.isLocked());
  }

  async countByDistrict(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    this.users.forEach(user => {
      if (user.district) {
        counts[user.district] = (counts[user.district] || 0) + 1;
      }
    });
    return counts;
  }

  async findSuspendedUsers(): Promise<User[]> {
    return this.users.filter(user => user.status === UserStatus.SUSPENDED);
  }

  async findBySessionId(_sessionId: string): Promise<User | null> {
    // Mock implementation
    return null;
  }

  async updateSessionActivity(_sessionId: string): Promise<boolean> {
    // Mock implementation
    return true;
  }

  async findActiveSession(sessionId: string): Promise<any> {
    // Mock implementation
    return {
      id: sessionId,
      userId: 'user-1',
      active: true
    };
  }

  async deleteSession(_sessionId: string): Promise<boolean> {
    // Mock implementation
    return true;
  }

  async deleteUserSessions(_userId: string): Promise<number> {
    // Mock implementation - return number of deleted sessions
    return 1;
  }

  // Test helper methods
  clear(): void {
    this.users = [];
    this.nextId = 1;
  }

  addUser(user: User): void {
    this.users.push(user);
  }
}