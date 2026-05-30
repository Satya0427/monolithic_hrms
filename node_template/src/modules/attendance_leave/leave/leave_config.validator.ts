import { z } from 'zod';

export const createLeaveTypeSchema = z.object({
    body: z.object({
        id: z.string()
            .regex(/^[a-f0-9]{24}$/, 'Invalid leave type id format')
            .optional()
            .nullable(),

        name: z.string()
            .min(1, 'Leave name is required')
            .max(100, 'Leave name cannot exceed 100 characters')
            .nullable(),

        code: z.string()
            .min(1, 'Leave code is required')
            .max(20, 'Leave code cannot exceed 20 characters')
            .regex(/^[A-Za-z0-9_]+$/, 'Leave code must contain only letters, numbers, and underscores'),

        category: z.enum(['PAID', 'UNPAID'], {
            required_error: 'Leave category is required'
        }),

        color: z.string()
            .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex value')
            .optional()
            .nullable(),

        description: z.string()
            .max(500, 'Description cannot exceed 500 characters')
            .optional()
            .nullable(),

        is_system: z.boolean()
            .optional()
            .default(false)
            .nullable(),

        is_active: z.boolean()
            .optional()
            .default(true)
            .nullable(),
    })
});

export const listLeaveTypesSchema = z.object({
    body: z.object({
        page: z.number()
            .optional()
            .default(1),

        limit: z.number()
            .optional()
            .default(10),

        search_key: z.string()
            .optional(),

        is_active: z.boolean()
            .optional()
    })
});

export const updateLeaveTypeStatusSchema = z.object({
    body: z.object({
        id: z.string()
            .min(1, 'Leave type id is required')
            .regex(/^[a-f0-9]{24}$/, 'Invalid leave type id format'),

        is_active: z.boolean()
    })
});

export const createLeavePolicySchema = z.object({
    body: z.object({
        id: z.string()
            .regex(/^[a-f0-9]{24}$/, 'Invalid policy id format')
            .optional()
            .nullable(),

        policy_name: z.string()
            .min(1, 'Policy name is required')
            .max(150, 'Policy name cannot exceed 150 characters'),

        description: z.string()
            .max(1000, 'Description cannot exceed 1000 characters')
            .optional()
            .nullable(),

        effective_from: z.string()
            .min(1, 'Effective from is required'),

        effective_to: z.string()
            .optional()
            .nullable(),

        status: z.enum(['DRAFT', 'ACTIVE'])
            .optional()
            .default('DRAFT'),

        applicability: z.object({
            employee_type: z.enum(['ALL', 'PERMANENT', 'CONTRACT']).default('ALL'),
            gender: z.enum(['ALL', 'MALE', 'FEMALE']).default('ALL'),
            marital_status: z.enum(['ALL', 'SINGLE', 'MARRIED']).default('ALL'),
            allow_during_probation: z.boolean().default(true),
            allow_during_notice_period: z.boolean().default(false)
        }),

        leave_rules: z.array(z.object({
            leave_type_id: z.string()
                .min(1, 'Leave type id is required')
                .regex(/^[a-f0-9]{24}$/, 'Invalid leave type id format'),
            accrual: z.object({
                frequency: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
                credit_amount: z.number().nonnegative(),
                max_balance: z.number().nonnegative()
            }),
            restrictions: z.object({
                max_per_month: z.number().nonnegative(),
                allow_half_day: z.boolean(),
                allow_negative_balance: z.boolean()
            }),
            approval: z.object({
                require_approval: z.boolean(),
                auto_approve: z.boolean(),
                document_required: z.boolean()
            })
        })).min(1, 'At least one leave rule is required'),

        sandwich_rule: z.object({
            enabled: z.boolean()
        })
    })
});

export const getLeavePolicyByIdSchema = z.object({
    body: z.object({
        id: z.string()
            .min(1, 'Policy id is required')
            .regex(/^[a-f0-9]{24}$/, 'Invalid policy id format')
    })
});

export const listLeavePoliciesSchema = z.object({
    body: z.object({
        page: z.number().optional().default(1),
        limit: z.number().optional().default(10),
        search_key: z.string().optional(),
        status: z.enum(['DRAFT', 'ACTIVE']).optional()
    })
});

export const deleteLeavePolicySchema = z.object({
    body: z.object({
        id: z.string()
            .min(1, 'Policy id is required')
            .regex(/^[a-f0-9]{24}$/, 'Invalid policy id format')
    })
});

export const createHolidaySchema = z.object({
    body: z.object({
        id: z.string()
            .regex(/^[a-f0-9]{24}$/, 'Invalid holiday id format')
            .optional()
            .nullable(),

        name: z.string()
            .min(1, 'Holiday name is required')
            .max(150, 'Holiday name cannot exceed 150 characters'),

        date: z.string()
            .min(1, 'Holiday date is required')
            .refine((val) => !isNaN(Date.parse(val)), 'Holiday date must be a valid date'),

        description: z.string()
            .max(500, 'Description cannot exceed 500 characters')
            .optional()
            .nullable(),

        type: z.enum(['NATIONAL', 'FESTIVAL', 'COMPANY']),

        is_optional: z.boolean().optional().default(false),
        is_paid: z.boolean().optional().default(true),

        color: z.string()
            .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex value')
            .optional()
            .nullable(),

        applicable_to: z.string()
            .optional()
            .nullable(),

        applicable_locations: z.array(z.string()).optional(),
        applicable_departments: z.array(z.string()).optional(),
        applicable_employee_types: z.array(z.string()).optional(),
        applicable_gender: z.array(z.string()).optional(),

        optional_holiday_rules: z.object({
            max_optional_leaves: z.number().nonnegative().optional().default(0),
            requires_approval: z.boolean().optional().default(false),
            auto_credit_leave: z.boolean().optional().default(false),
            allow_carry_forward: z.boolean().optional().default(false)
        }).optional().nullable(),

        is_active: z.boolean().optional().default(true)
    })
});

export const listHolidaySchema = z.object({
    body: z.object({
        year: z.number()
            .int('Year must be a whole number')
            .min(1900, 'Year is invalid')
            .max(3000, 'Year is invalid')
            .optional(),

        search_key: z.string().optional(),

        is_active: z.boolean().optional()
    })
});

export const deleteHolidaySchema = z.object({
    body: z.object({
        id: z.string()
            .min(1, 'Holiday id is required')
            .regex(/^[a-f0-9]{24}$/, 'Invalid holiday id format'),

        year: z.number()
            .int('Year must be a whole number')
            .min(1900, 'Year is invalid')
            .max(3000, 'Year is invalid')
            .optional()
    })
});

export const createWeeklyOffSchema = z.object({
    body: z.object({
        id: z.string()
            .regex(/^[a-f0-9]{24}$/, 'Invalid weekly off id format')
            .optional()
            .nullable(),

        name: z.string()
            .min(1, 'Policy name is required')
            .max(150, 'Policy name cannot exceed 150 characters'),

        effectiveFrom: z.string()
            .min(1, 'Effective from is required')
            .refine((val) => !isNaN(Date.parse(val)), 'Effective from must be a valid date'),

        offDays: z.record(
            z.object({
                Mon: z.boolean(),
                Tue: z.boolean(),
                Wed: z.boolean(),
                Thu: z.boolean(),
                Fri: z.boolean(),
                Sat: z.boolean(),
                Sun: z.boolean()
            })
        )
    })
});

export const getLeaveBalanceSchema = z.object({
    body: z.object({
        employee_id: z.preprocess(
            (val) => (val === '' ? undefined : val),
            z.string()
                .min(1, 'Employee id is required')
                .regex(/^[a-f0-9]{24}$/, 'Invalid employee id format')
        )
            .optional()
            .nullable(),

        as_of_date: z.preprocess(
            (val) => (val === '' ? undefined : val),
            z.string()
                .refine((val) => val == null || !isNaN(Date.parse(val)), 'as_of_date must be a valid date')
        )
            .optional()
            .nullable()
    })
});

export const applyLeaveSchema = z.object({
    body: z.object({
        employee_id: z.string()
            .min(1, 'Employee id is required')
            .regex(/^[a-f0-9]{24}$/, 'Invalid employee id format')
            .optional()
            .nullable(),

        leave_type_id: z.string()
            .min(1, 'Leave type id is required')
            .regex(/^[a-f0-9]{24}$/, 'Invalid leave type id format'),

        from_date: z.string()
            .min(1, 'From date is required')
            .refine((val) => !isNaN(Date.parse(val)), 'From date must be a valid date'),

        to_date: z.string()
            .min(1, 'To date is required')
            .refine((val) => !isNaN(Date.parse(val)), 'To date must be a valid date'),

        half_day: z.boolean().optional().default(false),
        half_day_type: z.enum(['FIRST_HALF', 'SECOND_HALF']).optional().nullable(),

        reason: z.string().optional().nullable()
    })
});

export const checkLeaveOverlapSchema = z.object({
    body: z.object({
        employee_id: z.string()
            .min(1, 'Employee id is required')
            .regex(/^[a-f0-9]{24}$/, 'Invalid employee id format'),

        leave_type_id: z.string()
            .regex(/^[a-f0-9]{24}$/, 'Invalid leave type id format')
            .optional()
            .nullable(),

        from_date: z.string()
            .min(1, 'From date is required')
            .refine((val) => !isNaN(Date.parse(val)), 'From date must be a valid date'),

        to_date: z.string()
            .min(1, 'To date is required')
            .refine((val) => !isNaN(Date.parse(val)), 'To date must be a valid date')
    })
});

export const updateLeaveRequestStatusSchema = z.object({
    body: z.object({
        leave_request_id: z.string()
            .min(1, 'Leave request id is required')
            .regex(/^[a-f0-9]{24}$/, 'Invalid leave request id format'),

        status: z.enum(['APPROVED', 'REJECTED']),
        remarks: z.string().optional().nullable()
    })
});

export const approveLeaveRequestSchema = z.object({
    body: z.object({
        leave_request_id: z.string()
            .min(1, 'Leave request id is required')
            .regex(/^[a-f0-9]{24}$/, 'Invalid leave request id format'),

        remarks: z.string().optional().nullable()
    })
});

export const listLeaveRequestsSchema = z.object({
    body: z.object({
        manager_id: z.string()
            .regex(/^[a-f0-9]{24}$/, 'Invalid manager id format')
            .optional()
            .nullable(),
            
        employee_id: z.string()
            .regex(/^[a-f0-9]{24}$/, 'Invalid employee id format')
            .optional()
            .nullable(),

        status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED'])
            .optional(),

        from_date: z.string().optional().nullable(),
        to_date: z.string().optional().nullable(),

        page: z.number().optional().default(1),
        limit: z.number().optional().default(10)
    })
});

export type CreateLeaveTypeInput = z.infer<typeof createLeaveTypeSchema>['body'];
export type ListLeaveTypesInput = z.infer<typeof listLeaveTypesSchema>['body'];
export type UpdateLeaveTypeStatusInput = z.infer<typeof updateLeaveTypeStatusSchema>['body'];
export type CreateLeavePolicyInput = z.infer<typeof createLeavePolicySchema>['body'];
export type GetLeavePolicyByIdInput = z.infer<typeof getLeavePolicyByIdSchema>['body'];
export type ListLeavePoliciesInput = z.infer<typeof listLeavePoliciesSchema>['body'];
export type DeleteLeavePolicyInput = z.infer<typeof deleteLeavePolicySchema>['body'];
export type CreateHolidayInput = z.infer<typeof createHolidaySchema>['body'];
export type ListHolidayInput = z.infer<typeof listHolidaySchema>['body'];
export type DeleteHolidayInput = z.infer<typeof deleteHolidaySchema>['body'];
export type CreateWeeklyOffInput = z.infer<typeof createWeeklyOffSchema>['body'];
export type GetLeaveBalanceInput = z.infer<typeof getLeaveBalanceSchema>['body'];
export type ApplyLeaveInput = z.infer<typeof applyLeaveSchema>['body'];
export type CheckLeaveOverlapInput = z.infer<typeof checkLeaveOverlapSchema>['body'];
export type UpdateLeaveRequestStatusInput = z.infer<typeof updateLeaveRequestStatusSchema>['body'];
export type ListLeaveRequestsInput = z.infer<typeof listLeaveRequestsSchema>['body'];
