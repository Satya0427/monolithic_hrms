import mongoose, { Schema, Types } from "mongoose";

export interface ILookup {
    _id?: Types.ObjectId;

    // ===== Category =====
    category_code: string;     // GENDER, WORK_TYPE
    category_name: string;     // Gender, Work Type

    // ===== Key / Value =====
    lookup_key: string;        // MALE, FEMALE, WFH
    lookup_value: string;      // Male, Female, Work From Home

    // ===== Scope =====
    scope: "PLATFORM" | "ORGANIZATION";
    organization_id?: Types.ObjectId;

    // ===== Display =====
    sort_order?: number;

    // ===== Flags =====
    is_system?: boolean;
    is_default?: boolean;

    // ===== Status =====
    is_active?: boolean;
    is_deleted?: boolean;

    // ===== Audit =====
    created_by?: Types.ObjectId;
    updated_by?: Types.ObjectId;

    // ===== Extra =====
    metadata?: Record<string, any>;

    // ===== Timestamps =====
    createdAt?: Date;
    updatedAt?: Date;
}
const LOOKUP_SCHEMA = new Schema(
    {
        // ===== Lookup Category =====
        category_code: {
            type: String,
            required: [true, "Category code is required"],
            trim: true,
            uppercase: true,
            minlength: [3, "Category code must be at least 3 characters"],
            maxlength: [50, "Category code cannot exceed 50 characters"],
            match: [
                /^[A-Z0-9_]+$/,
                "Category code must contain only uppercase letters, numbers, and underscores"
            ]
            // Examples: GENDER, WORK_TYPE, BLOOD_GROUP
        },

        category_name: {
            type: String,
            required: [true, "Category name is required"],
            trim: true,
            minlength: [3, "Category name must be at least 3 characters"],
            maxlength: [50, "Category name cannot exceed 50 characters"]
            // Example: Gender, Work Type
        },

        // ===== Lookup Key / Value =====
        lookup_key: {
            type: String,
            required: [true, "Lookup key is required"],
            trim: true,
            uppercase: true,
            minlength: [1, "Lookup key must be at least 1 character"],
            maxlength: [50, "Lookup key cannot exceed 50 characters"],
            match: [
                /^[A-Z0-9_]+$/,
                "Lookup key must contain only uppercase letters, numbers, and underscores"
            ]
            // Example: MALE, FEMALE, WFH
        },

        lookup_value: {
            type: String,
            required: [true, "Lookup value is required"],
            trim: true,
            minlength: [1, "Lookup value must be at least 1 character"],
            maxlength: [100, "Lookup value cannot exceed 100 characters"]
            // Example: Male, Work From Home
        },

        // ===== Display & Behavior =====
        sort_order: {
            type: Number,
            default: 0,
            min: [0, "Sort order cannot be negative"]
        },

        is_system: {
            type: Boolean,
            default: true
            // true = system provided (Gender)
            // false = org/admin created
        },

        is_default: {
            type: Boolean,
            default: false
        },

        // ===== Status =====
        is_active: {
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

        // ===== Extra Config =====
        metadata: {
            type: Object,
            default: {}
            // Example: { color: "#1976d2", icon: "male" }
        }
    },
    { timestamps: true }
);

LOOKUP_SCHEMA.index({
    category_code: 1,
    lookup_key: 1,
    scope: 1,
    organization_id: 1,
    is_deleted: 1
}, { unique: true });

const LOOKUP_MODEL = mongoose.model<ILookup>(
    "lookup",
    LOOKUP_SCHEMA,
    "lookup"
);

export { LOOKUP_MODEL };
