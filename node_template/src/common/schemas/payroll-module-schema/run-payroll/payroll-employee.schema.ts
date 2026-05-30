import mongoose, { Schema, Types } from "mongoose";

const PAYROLL_EMPLOYEE_SCHEMA = new Schema(
    {
        organization_id: { type: Types.ObjectId, required: true, index: true },
        payroll_run_id: { type: Types.ObjectId, required: true, index: true },
        employee_uuid: { type: Types.ObjectId, required: true, index: true },
        employee_code: { type: String, required: true },
        employee_name: { type: String, required: true },
        department_id: { type: Types.ObjectId },
        template_id: { type: Types.ObjectId, required: true },
        earnings: { type: [{ component_code: String, component_name: String, amount: Number }], default: [] },
        deductions: { type: [{ component_code: String, component_name: String, amount: Number, deduction_nature: String }], default: [] },
        working_days: Number,
        lop_days: Number,
        gross: Number,
        lop_deduction: Number,
        reimbursements: Number,
        total_earnings: Number,
        statutory_deductions: Number,
        loan_deductions: Number,
        other_deductions: Number,
        total_deductions: Number,
        net_pay: Number,
        status: { type: String, enum: ['DRAFT', 'PROCESSED', 'LOCKED'], default: 'DRAFT' },
        is_deleted: { type: Boolean, default: false }
    },
    { timestamps: true, collection: 'payroll_employees' }
);
PAYROLL_EMPLOYEE_SCHEMA.index({ payroll_run_id: 1, employee_uuid: 1 }, { unique: true });

const PAYROLL_EMPLOYEE_MODEL = mongoose.models.payroll_employees || mongoose.model('payroll_employees', PAYROLL_EMPLOYEE_SCHEMA, 'payroll_employees');
export default PAYROLL_EMPLOYEE_MODEL;