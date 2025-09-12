/**
 * Get User Profile Use Case
 * Handles retrieving user profile information
 */

import { injectable, inject } from 'tsyringe';
import { IUseCase, UseCaseResult, createSuccessResult, createErrorResult } from '../base/IUseCase';
import { IUserRepository } from '@/core/domain/repositories/IUserRepository';

export interface GetUserProfileRequest {
  userId: string;
}

export interface GetUserProfileResponse {
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    district?: string;
    department?: string;
    permissions: string[];
    createdAt: Date;
    lastLogin?: Date;
    lastLoginIP?: string;
  };
}

@injectable()
export class GetUserProfileUseCase implements IUseCase<GetUserProfileRequest, UseCaseResult<GetUserProfileResponse>> {
  constructor(
    @inject('IUserRepository')
    private userRepository: IUserRepository
  ) {}

  async execute(request: GetUserProfileRequest): Promise<UseCaseResult<GetUserProfileResponse>> {
    try {
      // Validate request
      if (!request.userId?.trim()) {
        return createErrorResult('User ID is required');
      }

      // Find user by ID
      const user = await this.userRepository.findById(request.userId);
      if (!user) {
        return createErrorResult('User not found');
      }

      const userData = user.toObject();

      // Prepare response (exclude sensitive information)
      const response: GetUserProfileResponse = {
        user: {
          id: userData.id,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          district: userData.district,
          department: userData.department,
          permissions: userData.permissions || [],
          createdAt: userData.createdAt,
          lastLogin: userData.lastLoginAt,
          lastLoginIP: userData.lastLoginIp
        }
      };

      return createSuccessResult(response);

    } catch (error) {
      return createErrorResult(`Failed to retrieve user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}