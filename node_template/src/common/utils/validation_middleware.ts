import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { apiResponse, apiDataResponse } from './api_response';
import logger from '../../config/logger';

/**
 * Zod Validation Middleware
 * Generic middleware for validating requests using Zod schemas
 */

interface ValidationData {
    params?: Record<string, any>;
    query?: Record<string, any>;
    body?: Record<string, any>;
}

/**
 * Create a validation middleware for Zod schemas
 * @param schema - Zod schema to validate against
 * @param dataSource - Which parts of request to validate ('params', 'query', 'body', or combination)
 * @returns Express middleware function
 */
export const validateRequest = (
    schema: ZodSchema,
    dataSource: 'params' | 'query' | 'body' | 'all' = 'body'
) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            let dataToValidate: ValidationData = {};

            if (dataSource === 'all' || dataSource === 'params') {
                dataToValidate.params = req.params;
            }
            if (dataSource === 'all' || dataSource === 'query') {
                dataToValidate.query = req.query;
            }
            if (dataSource === 'all' || dataSource === 'body') {
                dataToValidate.body = req.body;
            }

            const validatedData = schema.parse(dataToValidate);

            (req as any).validatedData = validatedData;

            if (validatedData.body) {
                (req as any).validatedBody = validatedData.body;
            }

            next();
        } catch (error) {
            if (error instanceof ZodError) {

                // ✅ Extract first error (most common UX pattern)
                const firstError = error.errors[0];

                const fieldPath = firstError?.path?.join('.') || 'unknown';

                logger.error('Validation error', {
                    field: fieldPath,
                    message: firstError.message
                });

                res.status(400).json(
                    apiDataResponse(
                        400,
                        'Validation failed',
                        {
                            field: fieldPath,
                            message: firstError.message
                        }
                    )
                );
                return;
            }

            next(error);
        }
    };
};


/**
 * Validate a single value using a Zod schema
 * Useful for manual validation in handlers
 * @param schema - Zod schema
 * @param data - Data to validate
 * @returns Validated data or throws ZodError
 */
export const validateData = <T>(schema: ZodSchema, data: unknown): T => {
    return schema.parse(data) as T;
};

/**
 * Safe validation - returns errors instead of throwing
 * @param schema - Zod schema
 * @param data - Data to validate
 * @returns { success: boolean, data?: T, errors?: ZodError }
 */
export const safeValidate = <T = any>(schema: ZodSchema, data: unknown): { success: boolean; data?: T; errors?: Array<{ field: string; message: string; code: string }> } => {
    const result = schema.safeParse(data);

    if (!result.success) {
        return {
            success: false,
            errors: result.error.errors.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
                code: err.code,
            })),
        };
    }

    return {
        success: true,
        data: result.data as T,
    };
};
