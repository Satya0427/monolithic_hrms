import { z } from 'zod';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid ObjectId');

export const validatePayrollMonthSchema = z.object({
    body: z.object({
        payroll_month: z.number().int().min(1).max(12),
        payroll_year: z.number().int().min(2000).max(2100)
    })
});

export const processPayrollSchema = z.object({
    body: z.object({
        payroll_month: z.number().int().min(1).max(12),
        payroll_year: z.number().int().min(2000).max(2100)
    })
});

export const recalculatePayrollSchema = z.object({
    body: z.object({
        payroll_run_id: objectId
    })
});

export const markPayrollProcessedSchema = z.object({
    body: z.object({
        payroll_run_id: objectId
    })
});

export const lockPayrollSchema = z.object({
    body: z.object({
        payroll_run_id: objectId,
        confirm_lock: z.boolean().default(true)
    })
});

export const getPayrollRunsSchema = z.object({
    body: z.object({
        status: z.enum(['DRAFT', 'PROCESSED', 'LOCKED', 'ALL']).optional().default('ALL'),
        payroll_month: z.number().int().min(1).max(12).optional(),
        payroll_year: z.number().int().min(2000).max(2100).optional(),
        page: z.coerce.number().int().positive().optional().default(1),
        limit: z.coerce.number().int().positive().optional().default(10)
    })
});

export const getPayrollRunByIdSchema = z.object({
    body: z.object({
        payroll_run_id: objectId
    })
});

export const getPayrollRunEmployeesSchema = z.object({
    body: z.object({
        payroll_run_id: objectId,
        status: z.enum(['DRAFT', 'PROCESSED', 'LOCKED', 'ALL']).optional().default('ALL'),
        search: z.string().optional().nullable(),
        page: z.coerce.number().int().positive().optional().default(1),
        limit: z.coerce.number().int().positive().optional().default(10)
    })
});
