/**
 * Get User Profile Use Case
 * Handles retrieving user profile information
 */
import { IUseCase, UseCaseResult } from '../base/IUseCase';
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
export declare class GetUserProfileUseCase implements IUseCase<GetUserProfileRequest, UseCaseResult<GetUserProfileResponse>> {
    private userRepository;
    constructor(userRepository: IUserRepository);
    execute(request: GetUserProfileRequest): Promise<UseCaseResult<GetUserProfileResponse>>;
}
//# sourceMappingURL=GetUserProfileUseCase.d.ts.map