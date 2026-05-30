import mongoose, { Schema, Types } from "mongoose";

export type UserRole =
    | "SUPER_ADMIN"
    | "HR_ADMIN"
    | "MANAGER"
    | "EMPLOYEE";

export type UserStatus =
    | "INVITED"
    | "ACTIVE"
    | "DISABLED";

export interface IUser {
    _id?: Types.ObjectId;

    // ================= BASIC IDENTITY =================
    first_name: string;
    last_name?: string;
    organization_id?: Types.ObjectId;
    address?: string;
    // ================= CONTACT DETAILS =================
    email: string;
    phone?: string;

    // ================= ACCESS CONTROL =================
    role: UserRole;
    status: UserStatus;
    last_login_at?: Date;

    // ================= PLATFORM CONTROL =================
    is_active: boolean;
    is_deleted: boolean;

    // ================= AUDIT =================
    created_by?: Types.ObjectId;
    updated_by?: Types.ObjectId;

    // ================= TIMESTAMPS =================
    createdAt?: Date;
    updatedAt?: Date;
}

const USER_SCHEMA = new Schema(
    {
        // ================= BASIC IDENTITY =================
        first_name: {
            type: String,
            required: [true, "First name is required"],
            trim: true,
            minlength: [2, "First name must be at least 2 characters"],
            maxlength: [50, "First name cannot exceed 50 characters"]
        },

        last_name: {
            type: String,
            trim: true,
            maxlength: [50, "Last name cannot exceed 50 characters"]
        },

        // ================= CONTACT DETAILS =================
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: [254, "Email cannot exceed 254 characters"],
            match: [
                /^\S+@\S+\.\S+$/,
                "Invalid email format"
            ],
            index: true
        },
        address: {
            type: String,
            trim: true,
            maxlength: [254, "Address cannot exceed 254 characters"],

        },
        phone: {
            type: String,
            trim: true,
            maxlength: [15, "Phone number cannot exceed 15 characters"]
        },

        // ================= ACCESS CONTROL =================
        role: {
            type: String,
            enum: {
                values: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
                message: "Invalid user role"
            },
            default: "EMPLOYEE"
        },

        status: {
            type: String,
            enum: {
                values: ["INVITED", "ACTIVE", "DISABLED"],
                message: "Invalid user status"
            },
            default: "INVITED"
        },
        organization_id: {
            type: Types.ObjectId,
            require: true
        },

        last_login_at: {
            type: Date
        },

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
// USER_SCHEMA.index({ employee_id: 1 });
const EMPLOYEE_USER_MODEL = mongoose.model<IUser>(
    "employee_user_details",
    USER_SCHEMA,
    "employee_user_details"
);

export { EMPLOYEE_USER_MODEL };
