/**
 * Simple Login User Use Case
 * Basic authentication without complex session management
 */
import { IUseCase, UseCaseResult } from '../base/IUseCase';
import { IUserRepository } from '@/core/domain/repositories/IUserRepository';
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
export declare class SimpleLoginUserUseCase implements IUseCase<SimpleLoginUserRequest, UseCaseResult<SimpleLoginUserResponse>> {
    private userRepository;
    constructor(userRepository: IUserRepository);
    execute(request: SimpleLoginUserRequest): Promise<UseCaseResult<SimpleLoginUserResponse>>;
    private hashPassword;
}
//# sourceMappingURL=SimpleLoginUserUseCase.d.ts.map