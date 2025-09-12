/**
 * Integration Tests for LoginUserUseCase
 */

import 'reflect-metadata';
import { LoginUserUseCase, LoginUserRequest } from '@/application/usecases/user/LoginUserUseCase';
import { MockUserRepository } from '../../../mocks/repositories/MockUserRepository';
import { User, UserRole, UserStatus } from '@/core/domain/entities/User';

describe('LoginUserUseCase Integration Tests', () => {
  let loginUserUseCase: LoginUserUseCase;
  let mockUserRepository: MockUserRepository;

  beforeEach(() => {
    mockUserRepository = new MockUserRepository();
    loginUserUseCase = new LoginUserUseCase(mockUserRepository);
  });

  afterEach(() => {
    mockUserRepository.clear();
  });

  const createTestUser = (overrides = {}): User => {
    // Use same MD5 hash as LoginUserUseCase
    const crypto = require('crypto');
    const passwordHash = crypto.createHash('md5').update('password123').digest('hex');
    
    return User.create({
      username: 'testuser',
      email: 'test@example.com',
      passwordHash,
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.OPERATOR,
      status: UserStatus.ACTIVE,
      permissions: ['employee:read', 'broadcast:create'],
      failedLoginAttempts: 0,
      ...overrides
    });
  };

  describe('Successful Login', () => {
    beforeEach(async () => {
      // Add test user to repository
      const testUser = createTestUser();
      await mockUserRepository.save(testUser);
    });

    it('should login successfully with valid credentials', async () => {
      // Arrange
      const loginRequest: LoginUserRequest = {
        username: 'testuser',
        password: 'password123',
        ipAddress: '127.0.0.1'
      };

      // Act
      const result = await loginUserUseCase.execute(loginRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.user.username).toBe('testuser');
      expect(result.data?.user.firstName).toBe('Test');
      expect(result.data?.sessionId).toBeDefined();
    });

    it('should update last login timestamp on successful login', async () => {
      // Arrange
      const loginRequest: LoginUserRequest = {
        username: 'testuser',
        password: 'password123',
        ipAddress: '127.0.0.1'
      };
      
      const userBefore = await mockUserRepository.findByUsername('testuser');
      expect(userBefore?.lastLoginAt).toBeUndefined();

      // Act
      const result = await loginUserUseCase.execute(loginRequest);

      // Assert
      expect(result.success).toBe(true);
      
      const userAfter = await mockUserRepository.findByUsername('testuser');
      expect(userAfter?.lastLoginAt).toBeDefined();
      expect(userAfter?.failedLoginAttempts).toBe(0);
    });
  });

  describe('Login Failures', () => {
    beforeEach(async () => {
      // Add test user to repository
      const testUser = createTestUser();
      await mockUserRepository.save(testUser);
    });

    it('should fail with invalid username', async () => {
      // Arrange
      const loginRequest: LoginUserRequest = {
        username: 'nonexistent',
        password: 'password123',
        ipAddress: '127.0.0.1'
      };

      // Act
      const result = await loginUserUseCase.execute(loginRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid username or password');
      expect(result.data).toBeUndefined();
    });

    it('should fail with invalid password', async () => {
      // Arrange
      const loginRequest: LoginUserRequest = {
        username: 'testuser',
        password: 'wrongpassword',
        ipAddress: '127.0.0.1'
      };

      // Act
      const result = await loginUserUseCase.execute(loginRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid username or password');

      // Verify failed login was recorded
      const user = await mockUserRepository.findByUsername('testuser');
      expect(user?.failedLoginAttempts).toBe(1);
    });

    it('should fail when user is inactive', async () => {
      // Arrange - Create inactive user
      const inactiveUser = createTestUser({ status: UserStatus.INACTIVE });
      await mockUserRepository.save(inactiveUser);

      const loginRequest: LoginUserRequest = {
        username: 'testuser',
        password: 'password123',
        ipAddress: '127.0.0.1'
      };

      // Act
      const result = await loginUserUseCase.execute(loginRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Account is not active');
    });
  });

  describe('Account Lockout', () => {
    beforeEach(async () => {
      // Create user with multiple failed attempts (just under lockout threshold)
      const userNearLockout = createTestUser({
        failedLoginAttempts: 4 // Assuming lockout at 5
      });
      await mockUserRepository.save(userNearLockout);
    });

    it('should lock account after maximum failed attempts', async () => {
      // Arrange
      const loginRequest: LoginUserRequest = {
        username: 'testuser',
        password: 'wrongpassword',
        ipAddress: '127.0.0.1'
      };

      // Act - This should trigger account lockout
      const result = await loginUserUseCase.execute(loginRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid username or password');

      // Verify user is locked
      const user = await mockUserRepository.findByUsername('testuser');
      expect(user?.failedLoginAttempts).toBe(5);
      expect(user?.lockedUntil).toBeDefined();
    });

    it('should reject login for locked account even with correct password', async () => {
      // Arrange - Lock the account first
      const lockedUser = createTestUser({
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000) // Locked for 15 minutes
      });
      await mockUserRepository.save(lockedUser);

      const loginRequest: LoginUserRequest = {
        username: 'testuser',
        password: 'password123', // Correct password
        ipAddress: '127.0.0.1'
      };

      // Act
      const result = await loginUserUseCase.execute(loginRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Account is temporarily locked');
    });
  });

  describe('Repository Error Handling', () => {
    it('should handle repository findByUsername errors gracefully', async () => {
      // Arrange
      jest.spyOn(mockUserRepository, 'findByUsername').mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const loginRequest: LoginUserRequest = {
        username: 'testuser',
        password: 'password123',
        ipAddress: '127.0.0.1'
      };

      // Act
      const result = await loginUserUseCase.execute(loginRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Login failed');
    });

    it('should handle repository updateLastLogin errors gracefully', async () => {
      // Arrange
      const testUser = createTestUser();
      await mockUserRepository.save(testUser);
      
      jest.spyOn(mockUserRepository, 'updateLastLogin').mockRejectedValueOnce(
        new Error('Database update failed')
      );

      const loginRequest: LoginUserRequest = {
        username: 'testuser',
        password: 'password123',
        ipAddress: '127.0.0.1'
      };

      // Act
      const result = await loginUserUseCase.execute(loginRequest);

      // Assert - Should fail due to updateLastLogin error
      expect(result.success).toBe(false);
      expect(result.error).toContain('Login failed');
    });
  });
});