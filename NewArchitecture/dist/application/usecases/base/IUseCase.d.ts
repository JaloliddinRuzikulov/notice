/**
 * Base Use Case Interface
 * Generic interface for all use cases following Command pattern
 */
export interface IUseCase<TRequest, TResponse> {
    execute(request: TRequest): Promise<TResponse>;
}
export interface IUseCaseSync<TRequest, TResponse> {
    execute(request: TRequest): TResponse;
}
export interface UseCaseResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    errors?: string[];
}
export declare function createSuccessResult<T>(data: T): UseCaseResult<T>;
export declare function createErrorResult<T>(error: string, errors?: string[]): UseCaseResult<T>;
//# sourceMappingURL=IUseCase.d.ts.map