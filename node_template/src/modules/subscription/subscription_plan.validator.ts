import { z } from 'zod';

/**
 * Subscription Plan Validation Schemas using Zod
 */

// Create Subscription Plan Schema
export const createSubscriptionPlanSchema = z.object({
    body: z.object({
        plan_name: z.string()
            .min(1, 'Plan name is required')
            .min(3, 'Plan name must be at least 3 characters')
            .max(100, 'Plan name cannot exceed 100 characters'),

        plan_code: z.string()
            .min(1, 'Plan code is required')
            .min(3, 'Plan code must be at least 3 characters')
            .max(50, 'Plan code cannot exceed 50 characters')
            .regex(/^[A-Z0-9_]+$/, 'Plan code must be uppercase letters, numbers, and underscores only'),

        monthlyPrice: z.number()
            .min(0, 'Monthly price must be 0 or greater')
            .finite('Monthly price must be a valid number'),

        yearlyPrice: z.number()
            .min(0, 'Yearly price must be 0 or greater')
            .finite('Yearly price must be a valid number'),

        employeeLimit: z.number()
            .int('Employee limit must be a whole number')
            .min(1, 'Employee limit must be at least 1')
            .positive('Employee limit must be greater than 0'),

        storageLimit: z.number()
            .min(0, 'Storage limit must be 0 or greater')
            .finite('Storage limit must be a valid number')
            .describe('Storage limit in GB'),

        modules: z.object({
            recruitment: z.boolean(),
            onboarding: z.boolean(),
            payroll: z.boolean(),
            performance: z.boolean(),
            learning: z.boolean(),
        })
            .refine(
                modules => Object.values(modules).some(v => v === true),
                { message: 'At least one module must be enabled' }
            ),

        description: z.string()
            .max(500, 'Description cannot exceed 500 characters')
            .optional(),

        is_public: z.boolean()
            .optional()
            .default(false),

        is_active: z.boolean()
            .optional()
            .default(true),

        plan_id: z.string()
            .optional()

    })
});

// Get Subscription Plan By ID Schema
export const getSubscriptionPlanByIdSchema = z.object({
    body: z.object({
        plan_id: z.string()
            .min(1, 'Plan ID is required')
            .regex(/^[a-f0-9]{24}$/, 'Invalid plan ID format (must be valid MongoDB ObjectId)')
            .describe('MongoDB ObjectId of the subscription plan'),
    })
});

// List Subscription Plans Schema
export const listSubscriptionPlansSchema = z.object({
    body: z.object({
        page: z.string()
            .optional()
            .default('1')
            .transform((val) => {
                const num = parseInt(val, 10);
                if (isNaN(num) || num < 1) return 1;
                return num;
            })
            .describe('Page number (1-indexed)'),

        limit: z.string()
            .optional()
            .default('10')
            .transform((val) => {
                const num = parseInt(val, 10);
                if (isNaN(num) || num < 1) return 10;
                if (num > 100) return 100; // Cap at 100
                return num;
            })
            .describe('Items per page (max 100)'),

        search_key: z.string()
            .optional()
    })
});

// Update Subscription Plan Schema
export const updateSubscriptionPlanSchema = z.object({
    params: z.object({
        planId: z.string()
            .min(1, 'Plan ID is required')
            .regex(/^[a-f0-9]{24}$/, 'Invalid plan ID format (must be valid MongoDB ObjectId)')
            .describe('MongoDB ObjectId of the subscription plan'),
    }),
    body: z.object({
        name: z.string()
            .min(3, 'Plan name must be at least 3 characters')
            .max(100, 'Plan name cannot exceed 100 characters')
            .optional(),

        plan_code: z.string()
            .min(3, 'Plan code must be at least 3 characters')
            .max(50, 'Plan code cannot exceed 50 characters')
            .regex(/^[A-Z0-9_]+$/, 'Plan code must be uppercase letters, numbers, and underscores only')
            .optional(),

        monthlyPrice: z.number()
            .min(0, 'Monthly price must be 0 or greater')
            .finite('Monthly price must be a valid number')
            .optional(),

        yearlyPrice: z.number()
            .min(0, 'Yearly price must be 0 or greater')
            .finite('Yearly price must be a valid number')
            .optional(),

        employeeLimit: z.number()
            .int('Employee limit must be a whole number')
            .min(1, 'Employee limit must be at least 1')
            .positive('Employee limit must be greater than 0')
            .optional(),

        storageLimit: z.number()
            .min(0, 'Storage limit must be 0 or greater')
            .finite('Storage limit must be a valid number')
            .optional(),

        modules: z.array(z.string())
            .min(1, 'At least one module is required')
            .optional(),

        description: z.string()
            .max(500, 'Description cannot exceed 500 characters')
            .optional(),

        is_public: z.boolean()
            .optional(),

        is_active: z.boolean()
            .optional(),
    }).strict() // Only allow fields defined in the schema
});

// Type exports for TypeScript
export type CreateSubscriptionPlanInput = z.infer<typeof createSubscriptionPlanSchema>['body'];
export type GetSubscriptionPlanByIdInput = z.infer<typeof getSubscriptionPlanByIdSchema>['body'];
export type ListSubscriptionPlansInput = z.infer<typeof listSubscriptionPlansSchema>['body'];
export type UpdateSubscriptionPlanInput = z.infer<typeof updateSubscriptionPlanSchema>['body'];

