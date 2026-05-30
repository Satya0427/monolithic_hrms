import { z } from 'zod';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid ObjectId');

export const EmployeeIdSchema = z.object({
    employee_id: objectId
});

export const SalaryHistoryPayloadSchema = z.object({
    employee_id: objectId,
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional()
});

export const AssignmentByIdPayloadSchema = z.object({
    id: objectId.optional(),
    employee_id: objectId.optional()
}).refine((data) => Boolean(data.id || data.employee_id), {
    message: 'Either id or employee_id is required'
});

export const DeactivateSalaryPayloadSchema = z.object({
    id: objectId,
    reason: z.string().optional()
});

export const AllAssignmentsPayloadSchema = z.object({
    status: z.enum(['ASSIGNED', 'NOT_ASSIGNED']).optional().nullable(),
    search: z.string().optional().nullable(),
    department_id: objectId.optional().nullable(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional()
});

export const EarningsSnapshotSchema = z.object({
    component_id: objectId,
    component_code: z.string(),
    component_name: z.string(),
    value_type: z.enum(['fixed', 'percentage', 'formula', 'FIXED', 'PERCENTAGE', 'FORMULA']),
    fixed_amount: z.number().nullable().optional(),
    percentage: z.number().nullable().optional(),
    formula: z.string().nullable().optional(),
    monthly_value: z.number(),
    annual_value: z.number(),
    override_allowed: z.boolean().optional(),
    is_mandatory: z.boolean().optional(),
    calculation_order: z.number().optional()
});

export const DeductionsSnapshotSchema = z.object({
    component_id: objectId,
    component_code: z.string(),
    component_name: z.string(),
    deduction_nature: z.string().optional(),
    calculation_type: z.enum(['fixed', 'percentage', 'percentage_of_basic', 'formula']),
    percentage: z.number().nullable().optional(),
    fixed_amount: z.number().nullable().optional(),
    formula: z.string().nullable().optional(),
    employer_contribution: z.coerce.number().optional(),
    employee_contribution: z.coerce.number().optional(),
    max_cap: z.number().nullable().optional(),
    monthly_value: z.number(),
    override_allowed: z.boolean().optional()
});

export const AssignSalaryPayloadSchema = z.object({
    employee_id: objectId,
    template_id: objectId,
    annual_ctc: z.number().positive(),
    monthly_gross: z.number().positive(),
    effective_from: z.string().datetime(),
    payroll_start_month: z.string().datetime().nullable().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    earnings_snapshot: z.array(EarningsSnapshotSchema).min(1),
    deductions_snapshot: z.array(DeductionsSnapshotSchema).min(1)
});
