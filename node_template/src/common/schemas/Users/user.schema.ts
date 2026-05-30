import mongoose, { Schema, Document, Types } from "mongoose";

interface IUser extends Document {
    name: string;
    employee_id?: string;
    email: string;
    password: string;
    phone_number?: string;
    address?: string;
    scope?: string;
    user_type?:string;
    organization_id?: Types.ObjectId;

    // --- RBAC SUPPORT ---
    primary_role_id?: Types.ObjectId; // optional, for UI default role
    last_permission_sync_at?: Date;

    // --- AUTH ---
    auth_provider: "LOCAL" | "GOOGLE" | "MICROSOFT" | "SAML";
    last_login_at?: Date;
    password_changed_at?: Date;
    failed_login_attempts: number;
    account_locked_until?: Date;

    // --- STATUS ---
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    is_email_verified: boolean;
    is_phone_verified: boolean;
    is_active: boolean;
    is_deleted: boolean;

    // --- AUDIT ---
    created_by?: Types.ObjectId;
    updated_by?: Types.ObjectId;

    metadata: any;
}

const USER_SCHEMA = new Schema<IUser>(
    {
        // ===== Basic Identity =====
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [3, "Name must be at least 3 characters"],
            maxlength: [50, "Name cannot exceed 50 characters"]
        },

        employee_id: {
            type: String,
            trim: true,
            unique: true,
            index: true,
            match: [
                /^[A-Z0-9]{2,10}-\d{4}$/,
                "Employee ID must be in format ORGCODE-0001"
            ]
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
            minlength: [5, "Email must be at least 5 characters"],
            maxlength: [254, "Email cannot exceed 254 characters"]
        },
        password: {
            type: String,
            required: [true, "Password is required"]
        },

        phone_number: {
            type: String,
            trim: true,
            minlength: [7, "Phone number must be at least 7 characters"],
            maxlength: [15, "Phone number cannot exceed 15 characters"]
        },

        address: {
            type: String,
            trim: true,
            maxlength: [250, "Address cannot exceed 250 characters"]
        },

        // ===== User Classification =====
        user_type: {
            type: String,
            required: [true, "User type is required"],
            enum: [
                "ORGANIZATION",
                "PLATFORM",
            ],
            default: "ORGANIZATION"
        },

        organization_id: {
            type: Schema.Types.ObjectId,
            ref: "organizations",
            required: function (this: IUser) {
                return this.user_type !== "PLATFORM_SUPER_ADMIN";
            }
        },

        // ===== RBAC SUPPORT =====
        primary_role_id: {
            type: Schema.Types.ObjectId,
            ref: "roles"
        },

        last_permission_sync_at: {
            type: Date
        },

        // ===== AUTH =====
        auth_provider: {
            type: String,
            enum: ["LOCAL", "GOOGLE", "MICROSOFT", "SAML"],
            default: "LOCAL"
        },

        last_login_at: {
            type: Date
        },

        password_changed_at: {
            type: Date
        },

        failed_login_attempts: {
            type: Number,
            default: 0
        },

        account_locked_until: {
            type: Date
        },

        // ===== STATUS =====
        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
            default: "ACTIVE"
        },

        is_email_verified: {
            type: Boolean,
            default: false
        },

        is_phone_verified: {
            type: Boolean,
            default: false
        },

        is_active: {
            type: Boolean,
            default: true
        },

        is_deleted: {
            type: Boolean,
            default: false
        },

        // ===== AUDIT =====
        created_by: {
            type: Schema.Types.ObjectId,
            ref: "users"
        },

        updated_by: {
            type: Schema.Types.ObjectId,
            ref: "users"
        },

        // ===== FUTURE FLEXIBILITY =====
        metadata: {
            type: Object,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

// Indexes
// USER_SCHEMA.index({ employee_id: 1 });
// USER_SCHEMA.index({ email: 1 });
// USER_SCHEMA.index({ organization_id: 1 });

export const USERS_MODEL = mongoose.model<IUser>("users", USER_SCHEMA);
