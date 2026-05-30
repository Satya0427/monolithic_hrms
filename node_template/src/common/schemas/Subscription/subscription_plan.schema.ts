import mongoose, { Schema, Document } from 'mongoose';

interface ISubscriptionPlan extends Document {
    plan_name: string;
    plan_code: string;
    description?: string;
    pricing: {
        monthly_price: number;
        yearly_price: number;
        currency: string;
    };
    limits: {
        employee_limit: number;
        storage_limit_gb: number;
    };
    modules: {
        recruitment: boolean;
        onboarding: boolean;
        payroll: boolean;
        performance: boolean;
        learning: boolean;
    };
    is_active: boolean;
    is_public: boolean;
    is_deleted: boolean;
    created_by?: mongoose.Schema.Types.ObjectId;
    updated_by?: mongoose.Schema.Types.ObjectId;
    metadata: any;
    createdAt?: Date;
    updatedAt?: Date;
}

const SUBSCRIPTION_PLAN_SCHEMA = new Schema<ISubscriptionPlan>(
    {
        // ===== Plan Identity =====
        plan_name: {
            type: String,
            required: [true, "Plan name is required"],
            trim: true,
            unique: true,
            minlength: [3, "Plan name must be at least 3 characters"],
            maxlength: [50, "Plan name cannot exceed 50 characters"]
        },

        plan_code: {
            type: String,
            required: [true, "Plan code is required"],
            trim: true,
            unique: true,
            uppercase: true,
            minlength: [2, "Plan code must be at least 2 characters"],
            maxlength: [20, "Plan code cannot exceed 20 characters"]
        },

        description: {
            type: String,
            trim: true,
            maxlength: [250, "Description cannot exceed 250 characters"]
        },

        // ===== Pricing (UI ALIGNED) =====
        pricing: {
            monthly_price: {
                type: Number,
                required: true,
                min: [0, "Monthly price cannot be negative"]
            },

            yearly_price: {
                type: Number,
                required: true,
                min: [0, "Yearly price cannot be negative"]
            },

            currency: {
                type: String,
                default: "INR"
            }
        },

        // ===== Limits (UI ALIGNED) =====
        limits: {
            employee_limit: {
                type: Number,
                required: true,
                min: [0, "Employee limit cannot be negative"]
            },

            storage_limit_gb: {
                type: Number,
                required: true,
                min: [0, "Storage limit cannot be negative"]
            }
        },

        // ===== Feature Access (UI ALIGNED) =====
        modules: {
            recruitment: { type: Boolean, default: false },
            onboarding: { type: Boolean, default: false },
            payroll: { type: Boolean, default: false },
            performance: { type: Boolean, default: false },
            learning: { type: Boolean, default: false }
        },

        // ===== Plan Control =====
        is_active: {
            type: Boolean,
            default: true
        },

        is_public: {
            type: Boolean,
            default: true
        },

        is_deleted: {
            type: Boolean,
            default: false
        },

        // ===== Audit =====
        created_by: {
            type: Schema.Types.ObjectId,
            ref: "users"
        },

        updated_by: {
            type: Schema.Types.ObjectId,
            ref: "users"
        },

        // ===== Future Flexibility =====
        metadata: {
            type: Object,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

// ===== Indexes =====
// SUBSCRIPTION_PLAN_SCHEMA.index({ plan_code: 1 });
// SUBSCRIPTION_PLAN_SCHEMA.index({ plan_name: 1 });

const SUBSCRIPTION_PLAN_MODEL = mongoose.model<ISubscriptionPlan>(
    "subscription_plans",
    SUBSCRIPTION_PLAN_SCHEMA,
    "subscription_plans"
);

export { SUBSCRIPTION_PLAN_MODEL, ISubscriptionPlan };
