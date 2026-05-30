import { z } from 'zod';
const objectId = z.string().min(12);


export const createComponentSchema = z.object({
    body: z.object({
        component_type: z.enum(['EARNINGS', 'DEDUCTIONS', 'REIMBURSEMENTS', 'VARIABLE_PAY']),
        component_name: z.string().min(2).max(100),
        component_code: z.string().toUpperCase().regex(/^[A-Z0-9_]+$/, 'Code must contain only uppercase letters, numbers, and underscores'),
        component_category: z.enum(['fixed', 'variable']).optional(),
        description: z.string().optional().nullable(),
        effective_from: z.string().datetime().nullable(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'ALL']).default('ACTIVE'),

        // Earning specific
        is_basic: z.boolean().optional(),

        // Deduction specific
        deduction_nature: z.enum(['statutory', 'non_statutory']).optional(),

        // Calculation
        calculation_type: z.enum(['fixed', 'percentage_of_basic', 'formula']),
        fixed_amount: z.number().positive().optional().nullable(),
        percentage: z.number().min(0).max(100).optional().nullable(),
        formula: z.string().optional().nullable(),

        // Contribution
        employer_contribution: z.boolean().optional().nullable(),
        employee_contribution: z.boolean().optional().nullable(),
        max_cap: z.number().positive().optional().nullable(),

        // Reimbursement
        claim_based: z.boolean().optional(),
        attachment_required: z.boolean().optional(),
        approval_required: z.boolean().optional(),
        max_limit_per_month: z.number().positive().optional().nullable(),

        // Variable Pay
        pay_frequency: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
        linked_to_kpi: z.boolean().optional(),
        auto_calculate: z.boolean().optional(),
        manual_override: z.boolean().optional(),

        // Statutory
        taxable: z.boolean().optional(),
        pf_applicable: z.boolean().optional(),
        esi_applicable: z.boolean().optional(),
        professional_tax_applicable: z.boolean().optional(),

        // Display
        show_in_payslip: z.boolean().optional(),
        pro_rated: z.boolean().optional(),
        include_in_ctc: z.boolean().optional()
    }).refine((data) => {
        // Calculation type validation
        if (data.calculation_type === 'fixed' && !data.fixed_amount) {
            return false;
        }
        if (data.calculation_type === 'percentage_of_basic' && !data.percentage) {
            return false;
        }
        if (data.calculation_type === 'formula' && !data.formula) {
            return false;
        }

        // Deduction must have deduction_nature
        if (data.component_type === 'DEDUCTIONS' && !data.deduction_nature) {
            return false;
        }

        return true;
    }, {
        message: 'Invalid calculation type values or missing deduction nature'
    })
});

export const updateComponentSchema = z.object({
    body: z.object({
        id: objectId,
        component_name: z.string().min(2).max(100).optional().nullable(),
        component_code: z.string().toUpperCase().regex(/^[A-Z0-9_]+$/).optional().nullable(),
        component_category: z.enum(['fixed', 'variable']).optional().nullable(),
        description: z.string().optional().nullable(),
        effective_from: z.string().datetime().optional().nullable(),
        status: z.enum(['ACTIVE', 'INACTIVE']).optional().nullable(),
        component_type: z.enum(['EARNINGS', 'DEDUCTIONS', 'REIMBURSEMENTS', 'VARIABLE_PAY']).optional().nullable(),
        is_basic: z.boolean().optional().nullable(),
        deduction_nature: z.enum(['statutory', 'non_statutory']).optional().nullable(),

        calculation_type: z.enum(['fixed', 'percentage_of_basic', 'formula']).optional().nullable(),
        fixed_amount: z.number().positive().optional().nullable(),
        percentage: z.number().min(0).max(100).optional().nullable(),
        formula: z.string().optional().nullable(),

        employer_contribution: z.boolean().optional(),
        employee_contribution: z.boolean().optional(),
        max_cap: z.number().positive().optional().nullable(),

        claim_based: z.boolean().optional(),
        attachment_required: z.boolean().optional(),
        approval_required: z.boolean().optional(),
        max_limit_per_month: z.number().positive().optional().nullable(),

        pay_frequency: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
        linked_to_kpi: z.boolean().optional(),
        auto_calculate: z.boolean().optional(),
        manual_override: z.boolean().optional(),

        taxable: z.boolean().optional(),
        pf_applicable: z.boolean().optional(),
        esi_applicable: z.boolean().optional(),
        professional_tax_applicable: z.boolean().optional(),

        show_in_payslip: z.boolean().optional(),
        pro_rated: z.boolean().optional(),
        include_in_ctc: z.boolean().optional()
    })
});

export const getComponentsQuerySchema = z.object({
    body: z.object({
        type: z.enum(['EARNINGS', 'DEDUCTIONS', 'REIMBURSEMENTS', 'VARIABLE_PAY']).optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'ALL']).optional(),
        search: z.string().optional().nullable(),
        page: z.number().optional().default(1),
        limit: z.number().optional().default(10)
    })
});

export const getComponentByIdSchema = z.object({
    body: z.object({
        id: objectId
    })
});

export const toggleStatusSchema = z.object({
    body: z.object({
        id: objectId
    })
});

export const deleteComponentSchema = z.object({
    body: z.object({
        id: objectId
    })
});



//#region TEMPLATE VALIDATION SCHEMAS
// Earning Item Schema

const earningItemSchema = z.object({
    component_id: objectId,
    value_type: z.enum(['fixed', 'percentage', 'formula']),
    fixed_amount: z.number().positive().optional().nullable(),
    percentage: z.number().min(0).max(100).optional().nullable(),
    formula: z.string().optional().nullable(),
    override_allowed: z.boolean().default(false),
    calculation_order: z.number().int().positive(),
    is_mandatory: z.boolean().default(true)
}).refine((data) => {
    // If value_type is FIXED, fixed_amount must be provided
    if (data.value_type === 'fixed' && !data.fixed_amount) {
        return false;
    }
    // If value_type is PERCENTAGE, percentage must be provided
    if (data.value_type === 'percentage' && data.percentage === undefined) {
        return false;
    }
    // If value_type is FORMULA, formula must be provided
    if(data.value_type === 'formula' && !data.formula) {
        return false;
    }
    return true;
}, {
    message: 'Fixed amount required for FIXED type, percentage required for PERCENTAGE type, formula required for FORMULA type'
});

// Deduction Item Schema
const deductionItemSchema = z.object({
    component_id: objectId,
    override_allowed: z.boolean().default(false)
});

// CTC Preview Schema
const ctcPreviewSchema = z.object({
    annual_ctc: z.number().positive().optional().nullable(),
    monthly_gross: z.number().positive().optional().nullable(),
    total_annual_earnings: z.number().min(0).default(0),
    total_monthly_earnings: z.number().min(0).default(0),
    total_annual_deductions: z.number().min(0).default(0),
    total_monthly_deductions: z.number().min(0).default(0),
    annual_net_salary: z.number().default(0),
    monthly_net_salary: z.number().default(0)
}).optional();

// CREATE TEMPLATE
export const createTemplateSchema = z.object({
    body: z.object({
        // Step 1: Basic Information
        template_name: z.string().min(2).max(100),
        template_code: z.string().toUpperCase().regex(/^[A-Z0-9_]+$/, 'Code must contain only uppercase letters, numbers, and underscores'),
        description: z.string().optional().nullable(),
        effective_from: z.string().datetime(),
        status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),

        // Step 2 & 3: Components Configuration
        earnings: z.array(earningItemSchema).min(1, 'At least one earning component required'),
        deductions: z.array(deductionItemSchema).default([]),

        // Step 4: CTC Preview
        ctc_preview: ctcPreviewSchema,

        // Step 5: Display & Controls
        allow_manual_override: z.boolean().default(false),
        lock_after_assignment: z.boolean().default(false),
        version_control_enabled: z.boolean().default(false)
    })
});

// GET ALL TEMPLATES
export const getAllTemplatesSchema = z.object({
    body: z.object({
        status: z.enum(['ACTIVE', 'INACTIVE']).optional().nullable(),
        search: z.string().optional().nullable(),
        page: z.number().optional().default(1),
        limit: z.number().optional().default(10)
    })
});

// GET TEMPLATE BY ID
export const getTemplateByIdSchema = z.object({
    body: z.object({
        id: objectId
    })
});

// UPDATE TEMPLATE
export const updateTemplateSchema = z.object({
    body: z.object({
        id: objectId,
        template_name: z.string().min(2).max(100).optional(),
        template_code: z.string().toUpperCase().regex(/^[A-Z0-9_]+$/).optional(),
        description: z.string().optional(),
        effective_from: z.string().datetime().optional(),
        status: z.enum(['ACTIVE', 'INACTIVE']).optional(),

        earnings: z.array(earningItemSchema).optional(),
        deductions: z.array(deductionItemSchema).optional(),

        ctc_preview: ctcPreviewSchema,

        allow_manual_override: z.boolean().optional(),
        lock_after_assignment: z.boolean().optional(),
        version_control_enabled: z.boolean().optional()
    })
});

//  DUPLICATE TEMPLATE
export const duplicateTemplateSchema = z.object({
    body: z.object({
        id: objectId,
        new_template_name: z.string().min(2).max(100),
        new_template_code: z.string().toUpperCase().regex(/^[A-Z0-9_]+$/)
    })
});

//  TOGGLE STATUS
export const toggleTemplateStatusSchema = z.object({
    body: z.object({
        id: objectId
    })
});

//  SOFT DELETE
export const deleteTemplateSchema = z.object({
    body: z.object({
        id: objectId
    })
});

//  VALIDATE TEMPLATE (Additional utility)
export const validateTemplateSchema = z.object({
    body: z.object({
        earnings: z.array(earningItemSchema),
        deductions: z.array(deductionItemSchema)
    })
});

// 8️⃣ GET TEMPLATES FOR ASSIGNMENT
export const getTemplatesForAssignmentSchema = z.object({
    body: z.object({
        search: z.string().optional().nullable(),
    })
});

// #endregion
