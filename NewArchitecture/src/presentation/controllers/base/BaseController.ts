/**
 * Base Controller
 * Provides common functionality for all controllers
 */

import { Request, Response } from 'express';
import { UseCaseResult } from '@/application/usecases/base/IUseCase';
import { ApiResponseDTO, PaginatedResponseDTO, PaginationDTO } from '@/application/dto/base/BaseDTO';

export abstract class BaseController {
  protected success<T>(res: Response, data: T, message?: string): Response {
    const response: ApiResponseDTO<T> = {
      success: true,
      data,
      message
    };
    return res.status(200).json(response);
  }

  protected created<T>(res: Response, data: T, message?: string): Response {
    const response: ApiResponseDTO<T> = {
      success: true,
      data,
      message: message || 'Resource created successfully'
    };
    return res.status(201).json(response);
  }

  protected noContent(res: Response, message?: string): Response {
    const response: ApiResponseDTO<null> = {
      success: true,
      data: null,
      message: message || 'Operation completed successfully'
    };
    return res.status(200).json(response);
  }

  protected badRequest(res: Response, message: string, errors?: string[]): Response {
    const response: ApiResponseDTO<null> = {
      success: false,
      data: null,
      error: message,
      errors
    };
    return res.status(400).json(response);
  }

  protected unauthorized(res: Response, message: string = 'Unauthorized'): Response {
    const response: ApiResponseDTO<null> = {
      success: false,
      data: null,
      error: message
    };
    return res.status(401).json(response);
  }

  protected forbidden(res: Response, message: string = 'Forbidden'): Response {
    const response: ApiResponseDTO<null> = {
      success: false,
      data: null,
      error: message
    };
    return res.status(403).json(response);
  }

  protected notFound(res: Response, message: string = 'Resource not found'): Response {
    const response: ApiResponseDTO<null> = {
      success: false,
      data: null,
      error: message
    };
    return res.status(404).json(response);
  }

  protected conflict(res: Response, message: string): Response {
    const response: ApiResponseDTO<null> = {
      success: false,
      data: null,
      error: message
    };
    return res.status(409).json(response);
  }

  protected internalError(res: Response, message: string = 'Internal server error'): Response {
    const response: ApiResponseDTO<null> = {
      success: false,
      data: null,
      error: message
    };
    return res.status(500).json(response);
  }

  protected paginated<T>(
    res: Response, 
    data: T[], 
    pagination: PaginationDTO,
    message?: string
  ): Response {
    const response: ApiResponseDTO<PaginatedResponseDTO<T>> = {
      success: true,
      data: {
        data,
        pagination
      },
      message
    };
    return res.status(200).json(response);
  }

  protected handleUseCaseResult<T>(
    res: Response, 
    result: UseCaseResult<T>,
    successMessage?: string,
    successStatusCode: number = 200
  ): Response {
    if (result.success && result.data) {
      const response: ApiResponseDTO<T> = {
        success: true,
        data: result.data,
        message: successMessage
      };
      return res.status(successStatusCode).json(response);
    } else {
      const response: ApiResponseDTO<null> = {
        success: false,
        data: null,
        error: result.error,
        errors: result.errors
      };

      // Determine appropriate status code based on error message
      const statusCode = this.getStatusCodeFromError(result.error || '');
      return res.status(statusCode).json(response);
    }
  }

  protected getPaginationFromQuery(req: Request): {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const sortBy = req.query.sortBy as string;
    const sortOrder = (req.query.sortOrder as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    return {
      page,
      limit,
      ...(sortBy && { sortBy }),
      sortOrder
    };
  }

  protected getUserFromRequest(req: Request): {
    id: string;
    username: string;
    role: string;
    permissions: string[];
  } {
    // This would be populated by authentication middleware
    return (req as any).user || {
      id: '',
      username: '',
      role: '',
      permissions: []
    };
  }

  protected getIPAddress(req: Request): string {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection as any)?.socket?.remoteAddress ||
           '0.0.0.0';
  }

  private getStatusCodeFromError(error: string): number {
    const lowerError = error.toLowerCase();

    if (lowerError.includes('not found')) return 404;
    if (lowerError.includes('unauthorized') || lowerError.includes('invalid credentials')) return 401;
    if (lowerError.includes('forbidden') || lowerError.includes('permission')) return 403;
    if (lowerError.includes('already exists') || lowerError.includes('duplicate')) return 409;
    if (lowerError.includes('validation') || lowerError.includes('invalid') || lowerError.includes('required')) return 400;

    return 500; // Internal server error as default
  }

  protected validateRequestBody(req: Request, requiredFields: string[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const body = req.body;

    for (const field of requiredFields) {
      if (!body[field]) {
        errors.push(`${field} is required`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  protected sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input.trim();
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }
}