import mongoose, { Schema, Types, Document } from "mongoose";

/* ===========================
   Interface
=========================== */

export interface IRole extends Document {
    role_name: string;
    role_code: string;
    description?: string;

    scope: "PLATFORM" | "ORGANIZATION";
    organization_id?: Types.ObjectId;

    is_system_role: boolean;
    is_default: boolean;
    priority: number;

    is_active: boolean;
    is_deleted: boolean;

    created_by?: Types.ObjectId;
    updated_by?: Types.ObjectId;

    metadata?: Record<string, any>;

    createdAt: Date;
    updatedAt: Date;
}

/* ===========================
   Schema
=========================== */

const ROLE_SCHEMA = new Schema(
    {
        role_name: {
            type: String,
            required: [true, "Role name is required"],
            trim: true,
            minlength: [3, "Role name must be at least 3 characters"],
            maxlength: [50, "Role name cannot exceed 50 characters"]
        },

        role_code: {
            type: String,
            required: [true, "Role code is required"],
            trim: true,
            uppercase: true,
            minlength: [3, "Role code must be at least 3 characters"],
            maxlength: [30, "Role code cannot exceed 30 characters"],
            match: [
                /^[A-Z0-9_]+$/,
                "Role code must contain only uppercase letters, numbers, and underscores"
            ],
            unique: true
        },

        description: {
            type: String,
            trim: true,
            maxlength: [250, "Description cannot exceed 250 characters"]
        },

        user_type: {
            type: String,
            required: [true, "Role scope is required"],
            enum: {
                values: ["PLATFORM", "ORGANIZATION"],
                message: "Scope must be PLATFORM or ORGANIZATION"
            },
            default: "ORGANIZATION"
        },

        organization_id: {
            type: Schema.Types.ObjectId,
            ref: "organizations",
            required: [
                function (this: IRole) {
                    return this.scope === "ORGANIZATION";
                },
                "Organization is required for organization-level roles"
            ]
        },

        is_system_role: {
            type: Boolean,
            default: false
        },

        is_default: {
            type: Boolean,
            default: false
        },

        priority: {
            type: Number,
            default: 0,
            min: [0, "Priority cannot be negative"]
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
            type: Schema.Types.ObjectId,
            ref: "users"
        },

        updated_by: {
            type: Schema.Types.ObjectId,
            ref: "users"
        },

        metadata: {
            type: Object,
            default: {}
        }
    },
    { timestamps: true }
);

/* ===========================
   Indexes
=========================== */

// Unique role code
// ROLE_SCHEMA.index({ role_code: 1 }, { unique: true });

// Organization-level unique role name
ROLE_SCHEMA.index(
    { organization_id: 1, role_name: 1 },
    {
        unique: true,
        partialFilterExpression: {
            scope: "ORGANIZATION",
            is_deleted: false
        }
    }
);

// Platform-level unique role name
ROLE_SCHEMA.index(
    { role_name: 1 },
    {
        unique: true,
        partialFilterExpression: {
            scope: "PLATFORM",
            is_deleted: false
        }
    }
);

// Common lookup index
ROLE_SCHEMA.index({
    scope: 1,
    organization_id: 1,
    is_active: 1,
    is_deleted: 1
});

// Priority sorting
ROLE_SCHEMA.index({ priority: -1 });

/* ===========================
   Model
=========================== */

const ROLES_MODEL = mongoose.model<IRole>(
    "roles",
    ROLE_SCHEMA,
    "roles"
);

export { ROLES_MODEL };
