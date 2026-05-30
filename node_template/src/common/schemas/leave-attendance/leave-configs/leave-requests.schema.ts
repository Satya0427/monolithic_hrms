import mongoose, { Document, Types } from "mongoose";

export type LeaveRequestStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type HalfDayType = 'FIRST_HALF' | 'SECOND_HALF';

export interface ILeaveRequest extends Document {
    organization_id: Types.ObjectId;
    employee_uuid: Types.ObjectId;
    leave_type_id: Types.ObjectId;
    policy_id: Types.ObjectId;
    from_date: Date;
    to_date: Date;
    total_days: number;
    half_day: boolean;
    half_day_type?: HalfDayType;
    reason?: string;
    status: LeaveRequestStatus;
    applied_at?: Date;
    approved_by?: Types.ObjectId;
    approved_at?: Date;
    approval_remarks?: string;
    created_by?: Types.ObjectId;
    updated_by?: Types.ObjectId;
    manager_id?: Types.ObjectId;
}

const LEAVE_REQUEST_SCHEMA = new mongoose.Schema(
    {
        organization_id: { type: mongoose.Schema.Types.ObjectId, required: true },
        employee_uuid: { type: mongoose.Schema.Types.ObjectId, required: true },
        leave_type_id: { type: mongoose.Schema.Types.ObjectId, required: true },
        policy_id: { type: mongoose.Schema.Types.ObjectId, required: true },

        from_date: { type: Date, required: true },
        to_date: { type: Date, required: true },
        total_days: { type: Number, required: true },

        half_day: { type: Boolean, default: false },
        half_day_type: {
            type: String,
            enum: ['FIRST_HALF', 'SECOND_HALF']
        },

        reason: { type: String },

        status: {
            type: String,
            enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED'],
            default: 'SUBMITTED'
        },

        applied_at: { type: Date },
        approved_by: { type: mongoose.Schema.Types.ObjectId },
        approved_at: { type: Date },
        approval_remarks: { type: String },

        created_by: { type: mongoose.Schema.Types.ObjectId },
        updated_by: { type: mongoose.Schema.Types.ObjectId },
        manager_id: { type: mongoose.Schema.Types.ObjectId }
    },
    { timestamps: true }
);

LEAVE_REQUEST_SCHEMA.index({ employee_uuid: 1, from_date: 1, to_date: 1 });
LEAVE_REQUEST_SCHEMA.index({ organization_id: 1, status: 1 });

export const LEAVE_REQUEST_MODEL = mongoose.model<ILeaveRequest>(
    'leave_requests',
    LEAVE_REQUEST_SCHEMA,
    'leave_requests'
);
