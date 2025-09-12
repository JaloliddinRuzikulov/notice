/**
 * Validation Middleware
 * Provides request validation functionality
 */
import { Request, Response, NextFunction } from 'express';
import { ValidationChain } from 'express-validator';
export declare class ValidationMiddleware {
    /**
     * Handle validation results
     */
    static handleValidation: (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Run validation chains and handle results
     */
    static validate: (validations: ValidationChain[]) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Sanitize request body
     */
    static sanitizeBody: (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Sanitize query parameters
     */
    static sanitizeQuery: (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Recursively sanitize object properties
     */
    private static sanitizeObject;
    /**
     * Validate file upload
     */
    static validateFileUpload: (options?: {
        required?: boolean;
        maxSize?: number;
        allowedMimeTypes?: string[];
        allowedExtensions?: string[];
    }) => (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Validate pagination parameters
     */
    static validatePagination: (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Validate date parameters
     */
    static validateDateRange: (startDateParam?: string, endDateParam?: string) => (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Validate required parameters
     */
    static requireParams: (params: string[]) => (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Validate UUID format
     */
    static validateUUID: (paramName?: string) => (req: Request, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=ValidationMiddleware.d.ts.map