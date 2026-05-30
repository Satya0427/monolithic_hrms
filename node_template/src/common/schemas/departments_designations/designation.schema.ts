import mongoose, { Schema, Types } from "mongoose";

/* ================= TYPES ================= */
export interface IDesignation {
    _id?: Types.ObjectId;

    // ================= ORGANIZATION =================
    organization_id: Types.ObjectId;

    // ================= RELATION =================
    department_id: Types.ObjectId;

    // ================= DESIGNATION DETAILS =================
    designation_code: string;
    designation_name: string;
    level?: number;

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
const DESIGNATION_SCHEMA = new Schema(
    {
        organization_id: {
            type: Types.ObjectId,
            ref: "organizations",
            required: [true, "Organization reference is required"],
            index: true
        },

        department_id: {
            type: Types.ObjectId,
            ref: "departments",
            required: [true, "Department reference is required"],
            index: true
        },

        designation_code: {
            type: String,
            required: [true, "Designation code is required"],
            trim: true,
            uppercase: true,
            minlength: [2, "Designation code must be at least 2 characters"],
            maxlength: [20, "Designation code cannot exceed 20 characters"]
        },

        designation_name: {
            type: String,
            required: [true, "Designation name is required"],
            trim: true,
            minlength: [3, "Designation name must be at least 3 characters"],
            maxlength: [100, "Designation name cannot exceed 100 characters"]
        },

        level: {
            type: Number,
            min: [1, "Level must be at least 1"],
            max: [10, "Level cannot exceed 10"]
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
DESIGNATION_SCHEMA.index({
    organization_id: 1,
    department_id: 1,
    designation_code: 1
});

/* ================= MODEL ================= */
const DESIGNATION_MODEL = mongoose.model<IDesignation>(
    "designations",
    DESIGNATION_SCHEMA,
    "designations"
);

export { DESIGNATION_MODEL };
