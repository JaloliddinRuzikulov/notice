/**
 * Logout User Use Case
 * Handles user logout functionality
 */
import { IUseCase, UseCaseResult } from '../base/IUseCase';
import { IUserRepository } from '@/core/domain/repositories/IUserRepository';
export interface LogoutUserRequest {
    userId: string;
    sessionId?: string;
}
export interface LogoutUserResponse {
    success: boolean;
    message: string;
}
export declare class LogoutUserUseCase implements IUseCase<LogoutUserRequest, UseCaseResult<LogoutUserResponse>> {
    private userRepository;
    constructor(userRepository: IUserRepository);
    execute(request: LogoutUserRequest): Promise<UseCaseResult<LogoutUserResponse>>;
}
//# sourceMappingURL=LogoutUserUseCase.d.ts.map