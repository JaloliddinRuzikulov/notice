/**
 * Logout User Use Case
 * Handles user logout functionality
 */

import { injectable, inject } from 'tsyringe';
import { IUseCase, UseCaseResult, createSuccessResult, createErrorResult } from '../base/IUseCase';
import { IUserRepository } from '@/core/domain/repositories/IUserRepository';

export interface LogoutUserRequest {
  userId: string;
  sessionId?: string;
}

export interface LogoutUserResponse {
  success: boolean;
  message: string;
}

@injectable()
export class LogoutUserUseCase implements IUseCase<LogoutUserRequest, UseCaseResult<LogoutUserResponse>> {
  constructor(
    @inject('IUserRepository')
    private userRepository: IUserRepository
  ) {}

  async execute(request: LogoutUserRequest): Promise<UseCaseResult<LogoutUserResponse>> {
    try {
      // Validate request
      if (!request.userId?.trim()) {
        return createErrorResult('User ID is required');
      }

      // Find user
      const user = await this.userRepository.findById(request.userId);
      if (!user) {
        return createErrorResult('User not found');
      }

      // For now, just return success - session management will be implemented later
      return createSuccessResult({
        success: true,
        message: 'User logged out successfully'
      });

    } catch (error) {
      return createErrorResult(`Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}