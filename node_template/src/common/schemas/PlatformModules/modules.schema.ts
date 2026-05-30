import { Schema, model, Document, Types } from "mongoose";

export interface IModule extends Document {
    module_name: string;
    module_code: string;
    description?: string;
    icon?: string;
    active: boolean;
    feature_ids: Types.ObjectId[];
    is_deleted: boolean;
    created_by?: Types.ObjectId;
    updated_by?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

const MODULE_SCHEMA = new Schema(
    {
        module_name: {
            type: String,
            required: [true, "Module name is required"],
            trim: true,
            minlength: [3, "Module name must be at least 3 characters"],
            maxlength: [100, "Module name cannot exceed 100 characters"]
        },

        module_code: {
            type: String,
            required: [true, "Module code is required"],
            trim: true,
            uppercase: true,
            minlength: [2, "Module code must be at least 2 characters"],
            maxlength: [50, "Module code cannot exceed 50 characters"],
            match: [
                /^[A-Z0-9_]+$/,
                "Module code must contain only uppercase letters, numbers, and underscores"
            ],
            unique: true
        },

        description: {
            type: String,
            trim: true,
            maxlength: [250, "Description cannot exceed 250 characters"]
        },

        icon: {
            type: String,
            trim: true,
            maxlength: [50, "Icon name cannot exceed 50 characters"]
        },

        display_order: {
            type: Number,
            default: 0,
            min: [0, "Display order cannot be negative"]
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



export const MODULE_MODEL = model<IModule>(
    "modules",
    MODULE_SCHEMA
);
