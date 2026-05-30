import mongoose, { Schema, Document, Types } from 'mongoose';


export interface IOrganizationDetails {
    organization_name: string;
    organization_code: string;
    domain: string;
    industry?: string;
    country?: string;
    company_size?: number;

    status?: "TRIAL" | "ACTIVE" | "SUSPENDED" | "INACTIVE";
    address?: string;
}

//  ================= SUBSCRIPTION DETAILS ======================
export interface ISubscriptionDetails {
    subscription_plan_id: Types.ObjectId | string;
    employee_limit: number;

    trial_days?: number;
    trial_start_date?: Date;
    trial_end_date?: Date;
}

//================== GLOBAL ADMIN DETAILS ========================
export interface IGlobalAdminDetails {
    name: string;
    contact_email: string;
    contact_phone?: string;
}

//   ================= MAIN ONBOARDING DOCUMENT ==================
export interface IOrganizationOnboarding {
    _id?: Types.ObjectId;
    organization: IOrganizationDetails;
    subscription: ISubscriptionDetails;
    global_admin: IGlobalAdminDetails;
    is_active?: boolean;
    is_deleted?: boolean;
    created_by?: Types.ObjectId | string;
    updated_by?: Types.ObjectId | string;
    createdAt?: Date;
    updatedAt?: Date;
}
const ORGANIZATION_ONBOARDING_SCHEMA = new Schema(
    {
        // ================= ORGANIZATION OBJECT =================
        organization: {
            organization_name: {
                type: String,
                required: [true, "Organization name is required"],
                trim: true,
                minlength: [3, "Organization name must be at least 3 characters"],
                maxlength: [100, "Organization name cannot exceed 100 characters"]
            },
            organization_code: {
                type: String,
                required: [true, "Organization code is required"],
                trim: true,
                uppercase: true,
                minlength: [2, "Organization code must be at least 2 characters"],
                maxlength: [5, "Organization code cannot exceed 10 characters"],
                match: [
                    /^[A-Z0-9]+$/,
                    "Organization code must contain only uppercase letters and numbers"
                ],
                unique: true
            },


            domain: {
                type: String,
                required: [true, "Domain is required"],
                trim: true,
                lowercase: true,
                maxlength: [100, "Domain cannot exceed 100 characters"]
            },

            industry: {
                type: String,
                trim: true,
                maxlength: [100, "Industry cannot exceed 100 characters"]
            },

            country: {
                type: String,
                trim: true,
                maxlength: [50, "Country cannot exceed 50 characters"]
            },

            company_size: {
                type: Number,
                min: [1, "Company size must be at least 1"]
            },
            address: {
                type: String,
                trim: true,
                maxlength: [250, "Address cannot exceed 250 characters"]
            },
        },

        // ================= SUBSCRIPTION OBJECT =================
        subscription: {
            subscription_plan_id: {
                type: Types.ObjectId,
                ref: "subscription_plans",
                required: [true, "Subscription plan is required"]
            },
            trial_days: {
                type: Number,
                min: [1, "Trial days must be at least 1"]
            },

            trial_start_date: {
                type: Date
            },

            trial_end_date: {
                type: Date
            }
        },

        // // ================= GLOBAL ADMIN OBJECT =================
        // global_admin: {
        //     name: {
        //         type: String,
        //         required: [true, "Admin name is required"],
        //         trim: true,
        //         maxlength: [100, "Admin name cannot exceed 100 characters"]
        //     },

        //     contact_email: {
        //         type: String,
        //         required: [true, "Admin email is required"],
        //         lowercase: true,
        //         trim: true,
        //         maxlength: [254, "Email cannot exceed 254 characters"]
        //     },

        //     contact_phone: {
        //         type: String,
        //         trim: true,
        //         maxlength: [15, "Phone number cannot exceed 15 characters"]
        //     }
        // },

        // ================= PLATFORM CONTROL =================
        is_active: {
            type: Boolean,
            default: true
        },

        is_deleted: {
            type: Boolean,
            default: false
        },

        // ================= AUDIT =================
        created_by: {
            type: Types.ObjectId,
            ref: "users"
        },

        updated_by: {
            type: Types.ObjectId,
            ref: "users"
        }
    },
    {
        timestamps: true
    }
);
// ORGANIZATION_ONBOARDING_SCHEMA.index({ organization_code: 1 });
const ORGANIZATION_MODEL = mongoose.model<IOrganizationOnboarding>(
    "organizations",
    ORGANIZATION_ONBOARDING_SCHEMA,
    "organizations"
);

export { ORGANIZATION_MODEL };
