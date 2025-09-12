/**
 * Login User Use Case
 * Handles user authentication and session creation
 */
import { IUseCase, UseCaseResult } from '../base/IUseCase';
import { IUserRepository } from '@/core/domain/repositories/IUserRepository';
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
export declare class LoginUserUseCase implements IUseCase<LoginUserRequest, UseCaseResult<LoginUserResponse>> {
    private userRepository;
    constructor(userRepository: IUserRepository);
    execute(request: LoginUserRequest): Promise<UseCaseResult<LoginUserResponse>>;
    private validateRequest;
    private hashPassword;
}
//# sourceMappingURL=LoginUserUseCase.d.ts.map