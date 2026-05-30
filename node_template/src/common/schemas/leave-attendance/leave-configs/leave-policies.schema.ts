import mongoose from "mongoose";

const LEAVE_RULE_SCHEMA = new mongoose.Schema(
    {
        leave_type_id: { type: mongoose.Types.ObjectId, required: true },
        
        accrual: {
            frequency: {
                type: String,
                enum: ['MONTHLY', 'QUARTERLY', 'YEARLY']
            },
            credit_amount: Number,
            max_balance: Number
        },

        restrictions: {
            max_per_month: Number,
            allow_half_day: { type: Boolean, default: false },
            allow_negative_balance: { type: Boolean, default: false }
        },

        approval: {
            require_approval: { type: Boolean, default: true },
            auto_approve: { type: Boolean, default: false },
            document_required: { type: Boolean, default: false }
        }
    },
    { _id: false }
);

const LEAVE_POLICY_SCHEMA = new mongoose.Schema(
    {
        organization_id: { type: mongoose.Types.ObjectId, required: true },

        policy_name: { type: String, required: true },
        description: String,

        status: {
            type: String,
            enum: ['DRAFT', 'ACTIVE'],
            default: 'DRAFT'
        },

        effective_from: { type: Date, required: true },
        effective_to: Date,

        applicability: {
            employee_type: {
                type: String,
                enum: ['ALL', 'PERMANENT', 'CONTRACT'],
                default: 'ALL'
            },
            gender: {
                type: String,
                enum: ['ALL', 'MALE', 'FEMALE'],
                default: 'ALL'
            },
            marital_status: {
                type: String,
                enum: ['ALL', 'SINGLE', 'MARRIED'],
                default: 'ALL'
            },
            allow_during_probation: { type: Boolean, default: true },
            allow_during_notice_period: { type: Boolean, default: false }
        },

        leave_rules: [LEAVE_RULE_SCHEMA],

        sandwich_rule: {
            enabled: { type: Boolean, default: false }
        }
    },
    { timestamps: true }
);

LEAVE_POLICY_SCHEMA.index({ organization_id: 1, policy_name: 1 }, { unique: true });

// USER_SCHEMA.index({ employee_id: 1 });
const LEAVE_POLICY_MODEL = mongoose.model(
    "leave_policy",
    LEAVE_POLICY_SCHEMA,
    "leave_policy"
);

export { LEAVE_POLICY_MODEL };