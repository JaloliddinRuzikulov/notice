/**
 * Simple Integration Test for LoginUserUseCase
 * Minimal test to verify the use case actually works
 */

import 'reflect-metadata';
import { LoginUserUseCase, LoginUserRequest } from '@/application/usecases/user/LoginUserUseCase';
import { User, UserRole, UserStatus } from '@/core/domain/entities/User';
import { IUserRepository } from '@/core/domain/repositories/IUserRepository';
import { createHash } from 'crypto';

// Helper to hash password like the use case does
function hashPassword(password: string): string {
  return createHash('md5').update(password).digest('hex');
}

// Minimal mock repository
class MinimalMockUserRepository implements Pick<IUserRepository, 'findByUsername' | 'recordFailedLogin'> {
  private users: User[] = [];

  async findByUsername(username: string): Promise<User | null> {
    return this.users.find(user => user.username === username) || null;
  }

  async recordFailedLogin(id: string): Promise<boolean> {
    const user = this.users.find(u => u.id === id);
    if (user) {
      user.recordFailedLogin();
      return true;
    }
    return false;
  }

  // Additional methods needed by LoginUserUseCase
  async findByCredentials(username: string, _passwordHash: string): Promise<User | null> {
    return this.findByUsername(username);
  }

  async resetFailedLoginAttempts(id: string): Promise<boolean> {
    const user = this.users.find(u => u.id === id);
    if (user) {
      // Reset failed attempts by updating the user object
      (user as any)._failedLoginAttempts = 0;
      (user as any)._lockedUntil = null;
      return true;
    }
    return false;
  }

  async updateLastLogin(id: string, ipAddress?: string): Promise<boolean> {
    const user = this.users.find(u => u.id === id);
    if (user) {
      user.recordSuccessfulLogin(ipAddress || '127.0.0.1');
      return true;
    }
    return false;
  }

  async createSession(userId: string, _data: any): Promise<string> {
    return `session-${userId}-${Date.now()}`;
  }


  // Test helpers
  addUser(user: User): void {
    this.users.push(user);
  }

  clear(): void {
    this.users = [];
  }
}

describe('LoginUserUseCase - Simple Test', () => {
  let useCase: LoginUserUseCase;
  let mockRepo: MinimalMockUserRepository;

  beforeEach(() => {
    mockRepo = new MinimalMockUserRepository();
    useCase = new LoginUserUseCase(mockRepo as any);
  });

  afterEach(() => {
    mockRepo.clear();
  });

  it('should login successfully with valid credentials', async () => {
    // Arrange
    const user = User.create({
      id: 'user-1',
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: hashPassword('password123'),
      firstName: 'Ahmad',
      lastName: 'Karimov',
      role: UserRole.OPERATOR,
      status: UserStatus.ACTIVE,
      permissions: ['employee:read']
    });
    
    mockRepo.addUser(user);

    const request: LoginUserRequest = {
      username: 'testuser',
      password: 'password123',
      ipAddress: '127.0.0.1'
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.user.username).toBe('testuser');
    expect(result.data?.user.firstName).toBe('Ahmad');
    expect(result.data?.sessionId).toBeDefined();
  });

  it('should fail with invalid username', async () => {
    // Arrange
    const request: LoginUserRequest = {
      username: 'nonexistent',
      password: 'password123',
      ipAddress: '127.0.0.1'
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    // Error message may vary
  });

  it('should fail with wrong password', async () => {
    // Arrange
    const user = User.create({
      id: 'user-2',
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: hashPassword('correctpassword'),
      firstName: 'Ahmad',
      lastName: 'Karimov',
      role: UserRole.OPERATOR,
      status: UserStatus.ACTIVE,
      permissions: ['employee:read']
    });
    
    mockRepo.addUser(user);

    const request: LoginUserRequest = {
      username: 'testuser',
      password: 'wrongpassword',
      ipAddress: '127.0.0.1'
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    // Error message may vary
  });

  it('should fail with inactive user', async () => {
    // Arrange
    const user = User.create({
      id: 'user-3',
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: hashPassword('password123'),
      firstName: 'Ahmad',
      lastName: 'Karimov',
      role: UserRole.OPERATOR,
      status: UserStatus.INACTIVE, // Inactive user
      permissions: ['employee:read']
    });
    
    mockRepo.addUser(user);

    const request: LoginUserRequest = {
      username: 'testuser',
      password: 'password123',
      ipAddress: '127.0.0.1'
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain('not active');
  });
});