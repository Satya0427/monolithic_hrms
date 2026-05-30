import mongoose, { Schema, Types } from "mongoose";

/* ================= TYPES ================= */
export interface IDepartment {
    _id?: Types.ObjectId;

    // ================= ORGANIZATION =================
    organization_id: Types.ObjectId;

    // ================= DEPARTMENT DETAILS =================
    department_code: string;
    department_name: string;
    description?: string;

    // ================= STATUS =================
    is_active: boolean;
    is_deleted: boolean;

    // ================= AUDIT =================
    created_by?: Types.ObjectId;
    updated_by?: Types.ObjectId;

    // ================= TIMESTAMPS =================
    createdAt?: Date;
    updatedAt?: Date;
}

/* ================= SCHEMA ================= */
const DEPARTMENT_SCHEMA = new Schema(
    {
        organization_id: {
            type: Types.ObjectId,
            ref: "organizations",
            required: [true, "Organization reference is required"],
            index: true
        },

        department_code: {
            type: String,
            required: [true, "Department code is required"],
            trim: true,
            uppercase: true,
            unique: true,
            minlength: [2, "Department code must be at least 2 characters"],
            maxlength: [20, "Department code cannot exceed 20 characters"]
        },

        department_name: {
            type: String,
            required: [true, "Department name is required"],
            trim: true,
            minlength: [3, "Department name must be at least 3 characters"],
            maxlength: [100, "Department name cannot exceed 100 characters"]
        },

        description: {
            type: String,
            trim: true,
            maxlength: [250, "Description cannot exceed 250 characters"]
        },

        is_active: {
            type: Boolean,
            default: true
        },

        is_deleted: {
            type: Boolean,
            default: false
        },

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

/* ================= INDEXES ================= */
DEPARTMENT_SCHEMA.index({ organization_id: 1, department_code: 1 });

/* ================= MODEL ================= */
const DEPARTMENT_MODEL = mongoose.model<IDepartment>(
    "departments",
    DEPARTMENT_SCHEMA,
    "departments"
);

export { DEPARTMENT_MODEL };
