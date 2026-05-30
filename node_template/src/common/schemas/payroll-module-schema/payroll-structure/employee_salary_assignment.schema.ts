import mongoose, { Schema, Types, Document } from "mongoose";

export type AssignmentStatusType = "ACTIVE" | "INACTIVE" | "REVISED";
export type EarningValueType = "fixed" | "percentage" | "formula" | "FIXED" | "PERCENTAGE" | "FORMULA";
export type DeductionCalculationType = "fixed" | "percentage" | "percentage_of_basic" | "formula";

// Earnings Snapshot in Assignment
export interface IEarningsSnapshot {
    component_id: Types.ObjectId;
    component_code: string;
    component_name: string;
    value_type: EarningValueType;
    fixed_amount?: number;
    percentage?: number;
    formula?: string;
    monthly_value: number;
    annual_value: number;
    override_allowed: boolean;
    is_mandatory: boolean;
    calculation_order: number;
}

// Deductions Snapshot in Assignment
export interface IDeductionsSnapshot {
    component_id: Types.ObjectId;
    component_code: string;
    component_name: string;
    deduction_nature?: "statutory" | "non_statutory";
    calculation_type: DeductionCalculationType;
    percentage?: number;
    fixed_amount?: number;
    formula?: string;
    employer_contribution?: number;
    employee_contribution?: number;
    max_cap?: number;
    monthly_value: number;
    override_allowed: boolean;
}

export interface IEmployeeSalaryAssignment extends Document {
    _id: Types.ObjectId;
    
    organization_id: Types.ObjectId;
    employee_id: Types.ObjectId;
    template_id: Types.ObjectId;
    
    // CTC Information
    annual_ctc: number;
    monthly_gross: number;
    
    // Assignment Details
    effective_from: Date;
    payroll_start_month?: Date | null;
    status: AssignmentStatusType;
    version: number;
    
    // Snapshots (Static copies from template/components)
    earnings_snapshot: IEarningsSnapshot[];
    deductions_snapshot: IDeductionsSnapshot[];
    
    // Status Flags
    is_active: boolean;
    is_deleted: boolean;
    
    // Payroll Lock Information
    payroll_lock_date?: Date;
    last_processed_date?: Date;
    
    // Audit Trail
    created_by: Types.ObjectId;
    updated_by?: Types.ObjectId;
    
    createdAt?: Date;
    updatedAt?: Date;
}

const EarningsSnapshotSchema = new Schema({
    component_id: {
        type: Types.ObjectId,
        ref: "payroll_salary_components",
        required: true
    },
    component_code: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    component_name: {
        type: String,
        required: true,
        trim: true
    },
    value_type: {
        type: String,
        enum: ["fixed", "percentage", "formula", "FIXED", "PERCENTAGE", "FORMULA"],
        required: true
    },
    fixed_amount: Number,
    percentage: {
        type: Number,
        min: 0,
        max: 100
    },
    formula: String,
    monthly_value: {
        type: Number,
        required: true,
        default: 0
    },
    annual_value: {
        type: Number,
        required: true,
        default: 0
    },
    override_allowed: {
        type: Boolean,
        default: false
    },
    is_mandatory: {
        type: Boolean,
        default: true
    },
    calculation_order: {
        type: Number,
        required: true
    }
}, { _id: false });

const DeductionsSnapshotSchema = new Schema({
    component_id: {
        type: Types.ObjectId,
        ref: "payroll_salary_components",
        required: true
    },
    component_code: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    component_name: {
        type: String,
        required: true,
        trim: true
    },
    deduction_nature: {
        type: String,
        enum: ["statutory", "non_statutory"]
    },
    calculation_type: {
        type: String,
        enum: ["fixed", "percentage", "percentage_of_basic", "formula"],
        required: true
    },
    percentage: {
        type: Number,
        min: 0,
        max: 100
    },
    fixed_amount: Number,
    formula: String,
    employer_contribution: {
        type: Number,
        default: 0
    },
    employee_contribution: {
        type: Number,
        default: 0
    },
    max_cap: Number,
    monthly_value: {
        type: Number,
        default: 0
    },
    override_allowed: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const EMPLOYEE_SALARY_ASSIGNMENT_SCHEMA = new Schema(
    {
        organization_id: {
            type: Types.ObjectId,
            ref: "organizations",
            required: true,
            index: true
        },
        
        employee_uuid: {
            type: Types.ObjectId,
            ref: "employees",
            required: true
        },
        
        template_id: {
            type: Types.ObjectId,
            ref: "payroll_salary_templates",
            required: true
        },
        
        annual_ctc: {
            type: Number,
            required: true,
            min: 0
        },
        
        monthly_gross: {
            type: Number,
            required: true,
            min: 0
        },
        
        effective_from: {
            type: Date,
            required: true
        },

        payroll_start_month: {
            type: Date,
            default: null
        },
        
        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE", "REVISED"],
            default: "ACTIVE"
        },
        
        version: {
            type: Number,
            default: 1
        },
        
        earnings_snapshot: {
            type: [EarningsSnapshotSchema],
            default: []
        },
        
        deductions_snapshot: {
            type: [DeductionsSnapshotSchema],
            default: []
        },
        
        is_active: {
            type: Boolean,
            default: true
        },
        
        is_deleted: {
            type: Boolean,
            default: false
        },
        
        payroll_lock_date: Date,
        
        last_processed_date: Date,
        
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
        collection: "employee_salary_assignments"
    }
);

// Compound index for organization + employee + is_active
// Ensures single active salary per employee per organization
EMPLOYEE_SALARY_ASSIGNMENT_SCHEMA.index(
    { organization_id: 1, employee_id: 1, is_active: 1 },
    { unique: false }
);

// Index for quick lookup of active assignments
EMPLOYEE_SALARY_ASSIGNMENT_SCHEMA.index({ organization_id: 1, is_active: 1 });
EMPLOYEE_SALARY_ASSIGNMENT_SCHEMA.index({ employee_id: 1, is_active: 1 });

// Index for soft delete queries
EMPLOYEE_SALARY_ASSIGNMENT_SCHEMA.index({ organization_id: 1, is_deleted: 1 });

const EMPLOYEE_SALARY_ASSIGNMENT_MODEL = mongoose.model<IEmployeeSalaryAssignment>(
    "employee_salary_assignments",
    EMPLOYEE_SALARY_ASSIGNMENT_SCHEMA
);

export { EMPLOYEE_SALARY_ASSIGNMENT_MODEL, EMPLOYEE_SALARY_ASSIGNMENT_SCHEMA };
