/**
 * Login User Use Case
 * Handles user authentication and session creation
 */

import { injectable, inject } from 'tsyringe';
import { IUseCase, UseCaseResult, createSuccessResult, createErrorResult } from '../base/IUseCase';
import { IUserRepository } from '@/core/domain/repositories/IUserRepository';
import { UserStatus } from '@/core/domain/entities/User';
import { createHash } from 'crypto';

export interface LoginUserRequest {
  username: string;
  password: string;
  ipAddress: string;
}

export interface LoginUserResponse {
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    district?: string;
    department?: string;
    permissions: string[];
  };
  sessionId: string;
}

@injectable()
export class LoginUserUseCase implements IUseCase<LoginUserRequest, UseCaseResult<LoginUserResponse>> {
  constructor(
    @inject('IUserRepository')
    private userRepository: IUserRepository
  ) {}

  async execute(request: LoginUserRequest): Promise<UseCaseResult<LoginUserResponse>> {
    try {
      // Validate request
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return createErrorResult('Invalid request', validation.errors);
      }

      // Find user by username
      const user = await this.userRepository.findByUsername(request.username);
      if (!user) {
        return createErrorResult('Invalid username or password');
      }

      let userData = user.toObject();

      // Check if user is locked
      if (userData.lockedUntil && userData.lockedUntil > new Date()) {
        return createErrorResult('Account is temporarily locked due to multiple failed login attempts');
      }

      // Check user status
      if (userData.status !== UserStatus.ACTIVE) {
        return createErrorResult('Account is not active');
      }

      // Check if user has ID (set a default if missing for new users)
      const userId = userData.id || `temp-${Date.now()}`;
      if (!userData.id) {
        console.warn('User missing ID, this should not happen in production');
        userData = { ...userData, id: userId };
      }

      // Verify password
      const hashedPassword = this.hashPassword(request.password);
      if (userData.passwordHash !== hashedPassword) {
        // Record failed login attempt
        await this.userRepository.recordFailedLogin(userId);
        return createErrorResult('Invalid username or password');
      }

      // Check credentials with repository method
      const authenticatedUser = await this.userRepository.findByCredentials(
        request.username, 
        hashedPassword
      );

      if (!authenticatedUser) {
        return createErrorResult('Authentication failed');
      }

      // Reset failed login attempts and update last login
      await this.userRepository.resetFailedLoginAttempts(userId);
      await this.userRepository.updateLastLogin(userId, request.ipAddress);

      // Create session
      const sessionId = await this.userRepository.createSession(userId, {
        ipAddress: request.ipAddress,
        loginTime: new Date()
      });

      // Prepare response
      const response: LoginUserResponse = {
        user: {
          id: userId,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          district: userData.district,
          department: userData.department,
          permissions: userData.permissions || []
        },
        sessionId
      };

      return createSuccessResult(response);

    } catch (error) {
      return createErrorResult(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateRequest(request: LoginUserRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.username?.trim()) {
      errors.push('Username is required');
    }

    if (!request.password?.trim()) {
      errors.push('Password is required');
    }

    if (!request.ipAddress?.trim()) {
      errors.push('IP address is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private hashPassword(password: string): string {
    // Simple MD5 hash - in production, use bcrypt or similar
    return createHash('md5').update(password).digest('hex');
  }
}