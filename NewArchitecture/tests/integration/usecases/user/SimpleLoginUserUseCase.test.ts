/**
 * Simple Login User Use Case Test
 */

import 'reflect-metadata';
import { SimpleLoginUserUseCase, SimpleLoginUserRequest } from '@/application/usecases/user/SimpleLoginUserUseCase';
import { User, UserRole, UserStatus } from '@/core/domain/entities/User';
import { IUserRepository } from '@/core/domain/repositories/IUserRepository';
import { createHash } from 'crypto';

// Helper to hash password like the use case does
function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'salt').digest('hex');
}

// Minimal mock repository - only implementing what we need
class SimpleUserRepository implements Pick<IUserRepository, 'findByUsername'> {
  private users: User[] = [];

  async findByUsername(username: string): Promise<User | null> {
    return this.users.find(user => user.username === username) || null;
  }

  // Test helpers
  addUser(user: User): void {
    this.users.push(user);
  }

  clear(): void {
    this.users = [];
  }
}

describe('SimpleLoginUserUseCase', () => {
  let useCase: SimpleLoginUserUseCase;
  let mockRepo: SimpleUserRepository;

  beforeEach(() => {
    mockRepo = new SimpleUserRepository();
    useCase = new SimpleLoginUserUseCase(mockRepo as any);
  });

  afterEach(() => {
    mockRepo.clear();
  });

  it('should login successfully with valid credentials', async () => {
    // Arrange
    const user = User.create({
      id: 'user-123',
      username: 'testuser',
      passwordHash: hashPassword('password123'),
      firstName: 'Ahmad',
      lastName: 'Karimov',
      role: UserRole.OPERATOR,
      status: UserStatus.ACTIVE,
      permissions: ['employee:read', 'broadcast:create']
    });

    mockRepo.addUser(user);

    const request: SimpleLoginUserRequest = {
      username: 'testuser',
      password: 'password123'
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.user.username).toBe('testuser');
    expect(result.data?.user.firstName).toBe('Ahmad');
    expect(result.data?.user.id).toBe('user-123');
    expect(result.data?.success).toBe(true);
  });

  it('should fail with invalid username', async () => {
    // Arrange
    const request: SimpleLoginUserRequest = {
      username: 'nonexistent',
      password: 'password123'
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid username or password');
  });

  it('should fail with wrong password', async () => {
    // Arrange
    const user = User.create({
      id: 'user-123',
      username: 'testuser',
      passwordHash: hashPassword('correctpassword'),
      firstName: 'Ahmad',
      lastName: 'Karimov',
      role: UserRole.OPERATOR,
      status: UserStatus.ACTIVE,
      permissions: ['employee:read']
    });

    mockRepo.addUser(user);

    const request: SimpleLoginUserRequest = {
      username: 'testuser',
      password: 'wrongpassword'
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid username or password');
  });

  it('should fail with inactive user', async () => {
    // Arrange
    const user = User.create({
      id: 'user-123',
      username: 'testuser',
      passwordHash: hashPassword('password123'),
      firstName: 'Ahmad',
      lastName: 'Karimov',
      role: UserRole.OPERATOR,
      status: UserStatus.INACTIVE, // Inactive
      permissions: ['employee:read']
    });

    mockRepo.addUser(user);

    const request: SimpleLoginUserRequest = {
      username: 'testuser',
      password: 'password123'
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain('User account is inactive');
  });

  it('should fail with empty username', async () => {
    // Arrange
    const request: SimpleLoginUserRequest = {
      username: '',
      password: 'password123'
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain('Username is required');
  });

  it('should fail with empty password', async () => {
    // Arrange
    const request: SimpleLoginUserRequest = {
      username: 'testuser',
      password: ''
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain('Password is required');
  });
});