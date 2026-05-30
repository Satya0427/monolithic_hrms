import mongoose from "mongoose";

const ATTENDANCE_RECORD_SCHEMA = new mongoose.Schema(
    {
        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },

        employee_uuid: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },

        attendance_date: {
            type: Date,
            required: true,
            index: true
        },

        shift_snapshot: {
            shift_id: mongoose.Schema.Types.ObjectId,
            shift_name: String,
            start_time: String,
            end_time: String,
            grace_minutes: Number
        },

        first_check_in: Date,
        last_check_out: Date,

        total_work_minutes: Number,
        total_break_minutes: Number,
        overtime_minutes: Number,
        late_minutes: Number,
        early_exit_minutes: Number,

        status: {
            type: String,
            enum: [
                'PRESENT',
                'ABSENT',
                'HALF_DAY',
                'HOLIDAY',
                'WEEKLY_OFF',
                'ON_LEAVE',
                'WFH',
            ],
            required: true
        },

        is_regularized: { type: Boolean, default: false },
        is_locked_for_payroll: { type: Boolean, default: false },

        payroll_impact: {
            deduction_days: Number,
            overtime_payable_minutes: Number
        }
    },
    { timestamps: true }
);

ATTENDANCE_RECORD_SCHEMA.index(
    { employee_uuid: 1, attendance_date: 1 },
    { unique: true }
);

export const ATTENDANCE_RECORD_MODEL = mongoose.model(
    "attendance_records",
    ATTENDANCE_RECORD_SCHEMA,
    "attendance_records"
);
