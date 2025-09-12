/**
 * Base Controller
 * Provides common functionality for all controllers
 */
import { Request, Response } from 'express';
import { UseCaseResult } from '@/application/usecases/base/IUseCase';
import { PaginationDTO } from '@/application/dto/base/BaseDTO';
export declare abstract class BaseController {
    protected success<T>(res: Response, data: T, message?: string): Response;
    protected created<T>(res: Response, data: T, message?: string): Response;
    protected noContent(res: Response, message?: string): Response;
    protected badRequest(res: Response, message: string, errors?: string[]): Response;
    protected unauthorized(res: Response, message?: string): Response;
    protected forbidden(res: Response, message?: string): Response;
    protected notFound(res: Response, message?: string): Response;
    protected conflict(res: Response, message: string): Response;
    protected internalError(res: Response, message?: string): Response;
    protected paginated<T>(res: Response, data: T[], pagination: PaginationDTO, message?: string): Response;
    protected handleUseCaseResult<T>(res: Response, result: UseCaseResult<T>, successMessage?: string, successStatusCode?: number): Response;
    protected getPaginationFromQuery(req: Request): {
        page: number;
        limit: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
    };
    protected getUserFromRequest(req: Request): {
        id: string;
        username: string;
        role: string;
        permissions: string[];
    };
    protected getIPAddress(req: Request): string;
    private getStatusCodeFromError;
    protected validateRequestBody(req: Request, requiredFields: string[]): {
        isValid: boolean;
        errors: string[];
    };
    protected sanitizeInput(input: any): any;
}
//# sourceMappingURL=BaseController.d.ts.map