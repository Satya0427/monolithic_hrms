import { z } from 'zod';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid ObjectId');
const nullableNumber = z.number().nullable().optional();

// 1 ASSIGN SALARY
export const assignSalarySchema = z.object({
    body: z.object({
        employee_uuid: objectId,
        template_id: objectId,
        annual_ctc: z.number().positive('Annual CTC must be positive'),
        monthly_gross: z.number().positive('Monthly Gross must be positive'),
        effective_from: z.string().datetime(),
        payroll_start_month: z.string().datetime().optional().nullable(),
        status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
        earnings_snapshot: z.array(z.object({
            component_id: objectId,
            component_code: z.string(),
            component_name: z.string(),
            value_type: z.enum(['fixed', 'percentage', 'formula', 'FIXED', 'PERCENTAGE', 'FORMULA']),
            fixed_amount: nullableNumber,
            percentage: nullableNumber,
            formula: z.string().optional().nullable(),
            monthly_value: z.number(),
            annual_value: z.number(),
            override_allowed: z.boolean().optional(),
            is_mandatory: z.boolean().optional(),
            calculation_order: z.number().optional()
        })).min(1, 'At least one earning component required'),
        deductions_snapshot: z.array(z.object({
            component_id: objectId,
            component_code: z.string(),
            component_name: z.string(),
            deduction_nature: z.string().optional(),
            calculation_type: z.enum(['fixed', 'percentage', 'percentage_of_basic', 'formula']),
            percentage: nullableNumber,
            fixed_amount: nullableNumber,
            formula: z.string().optional().nullable(),
            employer_contribution: z.coerce.number().optional().default(0),
            employee_contribution: z.coerce.number().optional().default(0),
            max_cap: z.number().optional().nullable(),
            monthly_value: z.number(),
            override_allowed: z.boolean().optional()
        })).min(1, 'At least one deduction component required')
    }).refine((data) => {
        const expectedMonthly = data.annual_ctc / 12;
        const tolerance = expectedMonthly * 0.02;
        return Math.abs(data.monthly_gross - expectedMonthly) <= tolerance;
    }, {
        message: 'Monthly Gross should be approximately Annual CTC / 12'
    })
});

// 2 GET EMPLOYEE SALARY
export const getEmployeeSalarySchema = z.object({
    body: z.object({
        employee_uuid: objectId
    })
});

// 3 REVISE SALARY
export const reviseSalarySchema = z.object({
    body: z.object({
        employee_uuid: objectId,
        template_id: objectId.optional(),
        annual_ctc: z.number().positive().optional(),
        monthly_gross: z.number().positive().optional(),
        effective_from: z.string().datetime(),
        payroll_start_month: z.string().datetime().optional().nullable(),
        earnings_overrides: z.array(z.object({
            component_id: objectId,
            monthly_value: z.number().optional(),
            annual_value: z.number().optional()
        })).optional(),
        reason: z.string().optional()
    }).refine((data) => {
        if (data.monthly_gross && data.annual_ctc) {
            const expectedMonthly = data.annual_ctc / 12;
            const tolerance = expectedMonthly * 0.02;
            return Math.abs(data.monthly_gross - expectedMonthly) <= tolerance;
        }
        return true;
    }, {
        message: 'Monthly Gross should be approximately Annual CTC / 12'
    })
});

// 4 GET SALARY HISTORY
export const getSalaryHistorySchema = z.object({
    body: z.object({
        employee_uuid: objectId,
        page: z.coerce.number().int().positive().optional().default(1),
        limit: z.coerce.number().int().positive().optional().default(10)
    })
});

// 5 DEACTIVATE SALARY
export const deactivateSalarySchema = z.object({
    body: z.object({
        id: objectId,
        reason: z.string().optional()
    })
});

// 6 GET ALL ASSIGNMENTS (LIST)
export const getAllAssignmentsSchema = z.object({
    body: z.object({
        status: z.enum(['ASSIGNED', 'NOT_ASSIGNED']).optional().nullable(),
        search: z.string().optional().nullable(),
        department_id: objectId.optional().nullable(),
        page: z.coerce.number().int().positive().optional().default(1),
        limit: z.coerce.number().int().positive().optional().default(100)
    })
});

// 7 GET ASSIGNMENT BY ID / EMPLOYEE ID
export const getAssignmentByIdSchema = z.object({
    body: z.object({
        id: objectId.optional(),
        employee_uuid: objectId.optional()
    }).refine((data) => Boolean(data.id || data.employee_uuid), {
        message: 'Either id or employee_uuid is required'
    })
});

// 8 VALIDATE CTC
export const validateCTCSchema = z.object({
    body: z.object({
        template_id: objectId,
        annual_ctc: z.number().positive()
    })
});
