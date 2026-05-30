import e from "express";
import mongoose, { Schema, Types, Document } from "mongoose";

export type ComponentType =
    | "EARNINGS"
    | "DEDUCTIONS"
    | "REIMBURSEMENTS"
    | "VARIABLE_PAY";

export type CalculationType =
    | "fixed"
    | "percentage_of_basic"
    | "formula";

export type StatusType = "ACTIVE" | "INACTIVE";

interface IPayrollSalaryComponent extends Document {
    _id: Types.ObjectId;

    organization_id: Types.ObjectId;

    component_type: ComponentType;

    // Basic Info
    component_name: string;
    component_code: string;
    component_category?: "FIXED" | "VARIABLE";
    description?: string;
    effective_from: Date;
    status: StatusType;

    is_basic?: boolean; // only for earning

    deduction_nature?: "statutory" | "non_statutory";

    // Calculation
    calculation_type: CalculationType;
    fixed_amount?: number;
    percentage?: number;
    formula?: string;

    // Deduction Contribution
    employer_contribution?: boolean;
    employee_contribution?: boolean;
    max_cap?: number;

    // Reimbursement
    claim_based?: boolean;
    attachment_required?: boolean;
    approval_required?: boolean;
    max_limit_per_month?: number;

    // Variable Pay
    pay_frequency?: "monthly" | "quarterly" | "yearly";
    linked_to_kpi?: boolean;
    auto_calculate?: boolean;
    manual_override?: boolean;

    // Statutory
    taxable?: boolean;
    pf_applicable?: boolean;
    esi_applicable?: boolean;
    professional_tax_applicable?: boolean;

    // Display
    show_in_payslip?: boolean;
    pro_rated?: boolean;
    include_in_ctc?: boolean;

    is_deleted?: boolean;

    created_by?: Types.ObjectId;
    updated_by?: Types.ObjectId;

    createdAt?: Date;
    updatedAt?: Date;
}

const PAYROLL_SALARY_COMPONENT_SCHEMA = new Schema(
    {
        organization_id: {
            type: Types.ObjectId,
            ref: "organizations",
            required: true,
            index: true
        },

        component_type: {
            type: String,
            enum: ["EARNINGS", "DEDUCTIONS", "REIMBURSEMENTS", "VARIABLE_PAY"],
            required: true
        },

        component_name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100
        },

        component_code: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            match: /^[A-Z0-9_]+$/
        },

        component_category: {
            type: String,
            enum: ["fixed", "variable"]
        },

        description: String,

        effective_from: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE"
        },

        is_basic: Boolean,

        deduction_nature: {
            type: String,
            enum: ["statutory", "non_statutory"]
        },

        calculation_type: {
            type: String,
            enum: ["fixed", "percentage_of_basic", "formula"],
            required: true
        },

        fixed_amount: Number,
        percentage: { type: Number, max: 100 },
        formula: String,

        employer_contribution: Boolean,
        employee_contribution: Boolean,
        max_cap: Number,

        claim_based: Boolean,
        attachment_required: Boolean,
        approval_required: Boolean,
        max_limit_per_month: Number,

        pay_frequency: {
            type: String,
            enum: ["monthly", "quarterly", "yearly"]
        },

        linked_to_kpi: Boolean,
        auto_calculate: Boolean,
        manual_override: Boolean,

        taxable: Boolean,
        pf_applicable: Boolean,
        esi_applicable: Boolean,
        professional_tax_applicable: Boolean,

        show_in_payslip: Boolean,
        pro_rated: Boolean,
        include_in_ctc: Boolean,

        is_deleted: { type: Boolean, default: false },

        created_by: { type: Types.ObjectId, ref: "users" },
        updated_by: { type: Types.ObjectId, ref: "users" }
    },
    { timestamps: true }
);

PAYROLL_SALARY_COMPONENT_SCHEMA.index(
    { organization_id: 1, component_code: 1 },
    { unique: true }
);

const PAYROLL_SALARY_COMPONENT_MODEL = mongoose.model<IPayrollSalaryComponent>(
    "payroll_salary_components",
    PAYROLL_SALARY_COMPONENT_SCHEMA,
    "payroll_salary_components"
);

export { PAYROLL_SALARY_COMPONENT_MODEL, IPayrollSalaryComponent };