/**
 * Simple Login User Use Case
 * Basic authentication without complex session management
 */

import { injectable, inject } from 'tsyringe';
import { IUseCase, UseCaseResult, createSuccessResult, createErrorResult } from '../base/IUseCase';
import { IUserRepository } from '@/core/domain/repositories/IUserRepository';
import { UserStatus } from '@/core/domain/entities/User';
import { createHash } from 'crypto';

export interface SimpleLoginUserRequest {
  username: string;
  password: string;
}

export interface SimpleLoginUserResponse {
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: string[];
  };
  success: boolean;
}

@injectable()
export class SimpleLoginUserUseCase implements IUseCase<SimpleLoginUserRequest, UseCaseResult<SimpleLoginUserResponse>> {
  constructor(
    @inject('IUserRepository')
    private userRepository: IUserRepository
  ) {}

  async execute(request: SimpleLoginUserRequest): Promise<UseCaseResult<SimpleLoginUserResponse>> {
    try {
      // Basic validation
      if (!request.username?.trim()) {
        return createErrorResult('Username is required');
      }

      if (!request.password?.trim()) {
        return createErrorResult('Password is required');
      }

      // Find user by username
      const user = await this.userRepository.findByUsername(request.username);
      if (!user) {
        return createErrorResult('Invalid username or password');
      }

      // Check user status
      if (user.status !== UserStatus.ACTIVE) {
        return createErrorResult('User account is inactive');
      }

      // Verify password
      const hashedPassword = this.hashPassword(request.password);
      if (user.passwordHash !== hashedPassword) {
        return createErrorResult('Invalid username or password');
      }

      // Ensure user has ID
      if (!user.id) {
        return createErrorResult('Invalid user data');
      }

      // Create successful response
      const response: SimpleLoginUserResponse = {
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role.toString(),
          permissions: user.permissions
        },
        success: true
      };

      return createSuccessResult(response);

    } catch (error) {
      return createErrorResult(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private hashPassword(password: string): string {
    return createHash('sha256').update(password + 'salt').digest('hex');
  }
}