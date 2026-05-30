import { z } from 'zod';

/**
 * MODULE FEATURES VALIDATION SCHEMAS (Zod)
 */

// Feature Object Schema
export const featureSchema = z.object({
    name: z
        .string()
        .min(3, 'Feature name must be at least 3 characters')
        .max(100, 'Feature name cannot exceed 100 characters')
        .trim(),

    code: z
        .string()
        .min(2, 'Feature code must be at least 2 characters')
        .max(50, 'Feature code cannot exceed 50 characters')
        .regex(/^[A-Z0-9_]+$/, 'Feature code must contain only uppercase letters, numbers, and underscores')
        .toUpperCase()
        .trim(),

    route_path: z
        .string()
        .min(1, 'Route path is required')
        .max(250, 'Route path cannot exceed 250 characters')
        .trim(),

    icon: z
        .string()
        .max(50, 'Icon name cannot exceed 50 characters')
        .optional(),

    is_active: z.boolean().default(true)
});


// Create Module Features Schema
export const createModuleFeaturesSchema = z.object({
    body: z.object({
        module_name: z
            .string()
            .min(3, 'Module name must be at least 3 characters')
            .max(100, 'Module name cannot exceed 100 characters')
            .trim(),

        module_code: z
            .string()
            .min(2, 'Module code must be at least 2 characters')
            .max(50, 'Module code cannot exceed 50 characters')
            .regex(/^[A-Z0-9_]+$/, 'Module code must contain only uppercase letters, numbers, and underscores')
            .toUpperCase()
            .trim(),

        description: z
            .string()
            .max(250, 'Description cannot exceed 250 characters')
            .optional(),

        icon: z
            .string()
            .max(50, 'Icon name cannot exceed 50 characters')
            .optional(),

        display_order: z
            .number()
            .int()
            .min(0, 'Display order cannot be negative')
            .optional(),

        is_active: z.boolean().default(true),

        features: z
            .array(featureSchema)
            .min(1, 'At least one feature is required')
    })
});


// Get Module Features By ID Schema
export const getModuleFeaturesSchema = z.object({
    moduleId: z.string().min(1, 'Module ID is required')
});

// List Module Features Schema (Pagination + Filters)
export const listModuleFeaturesSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    active: z.coerce.boolean().optional(),
    search: z.string().optional()
});

// Update Module Features Schema
export const updateModuleFeaturesSchema = z.object({
    moduleId: z.string().min(1, 'Module ID is required'),
    module_name: z.string().min(3, 'Module name must be at least 3 characters').max(100, 'Module name cannot exceed 100 characters').optional(),
    module_code: z.string().max(50, 'Module code cannot exceed 50 characters').toUpperCase().optional(),
    description: z.string().max(250, 'Description cannot exceed 250 characters').optional(),
    icon: z.string().max(50, 'Icon name cannot exceed 50 characters').optional(),
    active: z.boolean().optional(),
    features: z.array(featureSchema).optional()
}).strict();

/**
 * TypeScript Types Exported from Zod Schemas
 */
export type CreateModuleFeaturesInput = z.infer<typeof createModuleFeaturesSchema>;
export type GetModuleFeaturesInput = z.infer<typeof getModuleFeaturesSchema>;
export type ListModuleFeaturesInput = z.infer<typeof listModuleFeaturesSchema>;
export type UpdateModuleFeaturesInput = Omit<z.infer<typeof updateModuleFeaturesSchema>, 'moduleId'>;
export type FeatureInput = z.infer<typeof featureSchema>;
