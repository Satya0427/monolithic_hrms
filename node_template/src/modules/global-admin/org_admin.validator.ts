import { z } from 'zod';

/**
 * org ADMIN VALIDATION SCHEMAS (Zod)
 */

// Create org Admin Schema
export const createorgAdminSchema = z.object({
    body: z.object({
        adminId: z.string().optional(), // 👈 detect edit mode
        name: z
            .string()
            .min(3, 'Name must be at least 3 characters')
            .max(50, 'Name cannot exceed 50 characters')
            .trim(),

        employee_id: z
            .string()
            .min(3, 'Name must be at least 3 characters')
            .max(10, 'Name cannot exceed 10 characters')
            .trim()
            .optional(),

        email: z
            .string()
            .email('Invalid email address')
            .min(5, 'Email must be at least 5 characters')
            .max(254, 'Email cannot exceed 254 characters')
            .toLowerCase()
            .trim(),

        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .optional(),

        phone_number: z
            .string()
            .min(7, 'Phone number must be at least 7 characters')
            .max(15, 'Phone number cannot exceed 15 characters')
            .optional(),

        address: z
            .string()
            .max(250, 'Address cannot exceed 250 characters')
            .optional(),

        organization_id: z.string()
    })
});


// Get org Admin By ID Schema
export const getorgAdminByIdSchema = z.object({
    body: z.object({
        adminId: z.string().min(1, 'Admin ID is required')
    })
});

// List org Admins Schema (Pagination + Filters)
export const listorgAdminsSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
    search: z.string().optional()
});

// Update org Admin Schema
export const updateorgAdminSchema = z.object({
    adminId: z.string().min(1, 'Admin ID is required'),
    name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name cannot exceed 50 characters').optional(),
    phone_number: z.string().min(7, 'Phone number must be at least 7 characters').max(15, 'Phone number cannot exceed 15 characters').optional(),
    address: z.string().max(250, 'Address cannot exceed 250 characters').optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional()
}).strict();

/**
 * TypeScript Types Exported from Zod Schemas
 */
export type CreateorgAdminInput = z.infer<typeof createorgAdminSchema>;
export type GetorgAdminByIdInput = z.infer<typeof getorgAdminByIdSchema>;
export type ListorgAdminsInput = z.infer<typeof listorgAdminsSchema>;
export type UpdateorgAdminInput = Omit<z.infer<typeof updateorgAdminSchema>, 'adminId'>;
