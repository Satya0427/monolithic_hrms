import mongoose, { Document, Types } from "mongoose";

export interface ILeaveLedger extends Document {
    organization_id: Types.ObjectId;
    employee_uuid: Types.ObjectId;
    leave_type_id: Types.ObjectId;
    entry_type: 'CREDIT' | 'DEBIT' | 'ADJUSTMENT' | 'REVERSAL';
    quantity: number;
    effective_date: Date;
    reference_type: 'POLICY_ACCRUAL' | 'LEAVE_REQUEST' | 'ADMIN';
    reference_id?: Types.ObjectId;
}

const LEAVE_LEDGER_SCHEMA = new mongoose.Schema(
    {
        organization_id: { type: mongoose.Schema.Types.ObjectId, required: true },
        employee_uuid: { type: mongoose.Schema.Types.ObjectId, required: true },
        leave_type_id: { type: mongoose.Schema.Types.ObjectId, required: true },
        entry_type: {
            type: String,
            enum: ['CREDIT', 'DEBIT', 'ADJUSTMENT', 'REVERSAL'],
            required: true
        },

        quantity: {
            type: Number,
            required: true
        },

        effective_date: {
            type: Date,
            required: true
        },

        reference_type: {
            type: String,
            enum: ['POLICY_ACCRUAL', 'LEAVE_REQUEST', 'ADMIN'],
            required: true
        },

        reference_id: { type: mongoose.Schema.Types.ObjectId }
    },
    { timestamps: true }
);

LEAVE_LEDGER_SCHEMA.index(
    { employee_uuid: 1, leave_type_id: 1, effective_date: 1 }
);

export const LEAVE_LEDGER_MODEL = mongoose.model(
    'leave_ledger',
    LEAVE_LEDGER_SCHEMA,
    'leave_ledger'
);
