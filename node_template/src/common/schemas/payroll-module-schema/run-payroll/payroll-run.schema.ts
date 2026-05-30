import mongoose, { Schema, Types } from "mongoose";

const PAYROLL_RUN_SCHEMA = new Schema(
    {
        organization_id: { type: Types.ObjectId, required: true, index: true },
        payroll_month: { type: Number, required: true, min: 1, max: 12, index: true },
        payroll_year: { type: Number, required: true, index: true },
        status: { type: String, enum: ['DRAFT', 'PROCESSED', 'LOCKED'], default: 'DRAFT' },
        processed_at: Date,
        locked_at: Date,
        total_employees: { type: Number, default: 0 },
        total_gross: { type: Number, default: 0 },
        total_earnings: { type: Number, default: 0 },
        total_deductions: { type: Number, default: 0 },
        total_payout_amount: { type: Number, default: 0 },
        recalculation_count: { type: Number, default: 0 },
        warnings: { type: [String], default: [] },
        processed_by: { type: Types.ObjectId, ref: 'users' },
        locked_by: { type: Types.ObjectId, ref: 'users' },
        is_deleted: { type: Boolean, default: false },
        created_by: { type: Types.ObjectId, ref: 'users' },
        updated_by: { type: Types.ObjectId, ref: 'users' }
    },
    { timestamps: true, collection: 'payroll_runs' }
);
PAYROLL_RUN_SCHEMA.index({ organization_id: 1, payroll_year: 1, payroll_month: 1 }, { unique: true });

const PAYROLL_RUN_MODEL = mongoose.model('payroll_runs', PAYROLL_RUN_SCHEMA, 'payroll_runs');
export default PAYROLL_RUN_MODEL;