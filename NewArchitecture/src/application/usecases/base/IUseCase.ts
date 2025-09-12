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

// Result wrapper for consistent response handling
export interface UseCaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
}

// Helper function to create success result
export function createSuccessResult<T>(data: T): UseCaseResult<T> {
  return {
    success: true,
    data
  };
}

// Helper function to create error result
export function createErrorResult<T>(error: string, errors?: string[]): UseCaseResult<T> {
  return {
    success: false,
    error,
    errors
  };
}