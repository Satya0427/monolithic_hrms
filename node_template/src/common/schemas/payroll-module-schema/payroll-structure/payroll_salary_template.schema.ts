import mongoose, { Schema, Types, Document } from "mongoose";

export type TemplateStatusType = "ACTIVE" | "INACTIVE";
export type ValueType = "fixed" | "percentage" | "formula";

// Earnings Component in Template
export interface ITemplateEarning {
    component_id: Types.ObjectId;
    value_type: ValueType;
    fixed_amount?: number;
    percentage?: number;
    formula?: string;
    override_allowed: boolean;
    calculation_order: number;
    is_mandatory: boolean;
}

// Deduction Component in Template
export interface ITemplateDeduction {
    component_id: Types.ObjectId;
    override_allowed: boolean;
    value_type: ValueType;
    fixed_amount?: number;
    percentage?: number;
    formula?: string;
    calculation_order: number;
    is_mandatory: boolean;
}



// CTC Preview Structure
export interface ICTCPreview {
    annual_ctc?: number;
    monthly_gross?: number;
    total_annual_earnings: number;
    total_monthly_earnings: number;
    total_annual_deductions: number;
    total_monthly_deductions: number;
    annual_net_salary: number;
    monthly_net_salary: number;
}

export interface IPayrollSalaryTemplate extends Document {
    _id: Types.ObjectId;
    organization_id: Types.ObjectId;

    // Basic Information
    template_name: string;
    template_code: string;
    description?: string;
    effective_from: Date;
    status: TemplateStatusType;

    // Components Configuration
    earnings: ITemplateEarning[];
    deductions: ITemplateDeduction[];

    // CTC Preview
    ctc_preview?: ICTCPreview;

    // Display & Controls
    allow_manual_override: boolean;
    lock_after_assignment: boolean;
    version_control_enabled: boolean;

    // Version Management
    version: number;
    parent_template_id?: Types.ObjectId;

    // Assignment Info
    employees_count: number;

    // Soft Delete
    is_deleted: boolean;

    // Audit
    created_by: Types.ObjectId;
    updated_by?: Types.ObjectId;

    createdAt?: Date;
    updatedAt?: Date;
}

const TemplateEarningSchema = new Schema({
    component_id: {
        type: Types.ObjectId,
        ref: "payroll_salary_components",
        required: true
    },
    value_type: {
        type: String,
        enum: ["fixed", "percentage", "formula"],
        required: true
    },
    fixed_amount: {
        type: Number,
        min: 0
    },
    percentage: {
        type: Number,
        min: 0,
        max: 100
    },
    override_allowed: {
        type: Boolean,
        default: false
    },
    formula: {
        type: String
    },
    calculation_order: {
        type: Number,
        required: true,
        min: 1
    },
    is_mandatory: {
        type: Boolean,
        default: true
    }
}, { _id: false });

const TemplateDeductionSchema = new Schema({
    component_id: {
        type: Types.ObjectId,
        ref: "payroll_salary_components",
        required: true
    },
    override_allowed: {
        type: Boolean,
        default: false
    },
    value_type: {
        type: String,
        enum: ["fixed", "percentage", "formula"],
        required: true
    },
    fixed_amount: {
        type: Number,
        min: 0
    },
    percentage: {
        type: Number,
        min: 0,
        max: 100
    },
    formula: {
        type: String
    },
    calculation_order: {
        type: Number,
        required: true,
        min: 1
    },
    is_mandatory: {
        type: Boolean,
        default: true
    }
}, { _id: false });

const CTCPreviewSchema = new Schema({
    annual_ctc: Number,
    monthly_gross: Number,
    total_annual_earnings: {
        type: Number,
        default: 0
    },
    total_monthly_earnings: {
        type: Number,
        default: 0
    },
    total_annual_deductions: {
        type: Number,
        default: 0
    },
    total_monthly_deductions: {
        type: Number,
        default: 0
    },
    annual_net_salary: {
        type: Number,
        default: 0
    },
    monthly_net_salary: {
        type: Number,
        default: 0
    }
}, { _id: false });

const PAYROLL_SALARY_TEMPLATE_SCHEMA = new Schema(
    {
        organization_id: {
            type: Types.ObjectId,
            ref: "organizations",
            required: true,
            index: true
        },

        template_name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100
        },

        template_code: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            match: /^[A-Z0-9_]+$/
        },

        description: {
            type: String,
            trim: true
        },

        effective_from: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE"
        },

        earnings: {
            type: [TemplateEarningSchema],
            default: []
        },

        deductions: {
            type: [TemplateDeductionSchema],
            default: []
        },

        ctc_preview: {
            type: CTCPreviewSchema
        },

        allow_manual_override: {
            type: Boolean,
            default: false
        },

        lock_after_assignment: {
            type: Boolean,
            default: false
        },

        version_control_enabled: {
            type: Boolean,
            default: false
        },

        version: {
            type: Number,
            default: 1
        },

        parent_template_id: {
            type: Types.ObjectId,
            ref: "payroll_salary_templates"
        },

        employees_count: {
            type: Number,
            default: 0
        },

        is_deleted: {
            type: Boolean,
            default: false
        },

        created_by: {
            type: Types.ObjectId,
            ref: "users",
            required: true
        },

        updated_by: {
            type: Types.ObjectId,
            ref: "users"
        }
    },
    {
        timestamps: true,
        collection: "payroll_salary_templates"
    }
);

// Compound unique index for organization_id + template_code
PAYROLL_SALARY_TEMPLATE_SCHEMA.index(
    { organization_id: 1, template_code: 1 },
    { unique: true }
);

// Index for template search and filtering
PAYROLL_SALARY_TEMPLATE_SCHEMA.index({ organization_id: 1, status: 1 });
PAYROLL_SALARY_TEMPLATE_SCHEMA.index({ organization_id: 1, is_deleted: 1 });

const PAYROLL_SALARY_TEMPLATE_MODEL = mongoose.model<IPayrollSalaryTemplate>(
    "payroll_salary_templates",
    PAYROLL_SALARY_TEMPLATE_SCHEMA
);

export { PAYROLL_SALARY_TEMPLATE_MODEL, PAYROLL_SALARY_TEMPLATE_SCHEMA };
