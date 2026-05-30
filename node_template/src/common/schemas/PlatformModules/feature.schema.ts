import { Schema, model, Document, Types } from "mongoose";

export interface IFeature extends Document {
    name: string;
    code: string;
    route_path: string;
    module_code: string;
    icon?: string;
    active: boolean;
    is_deleted: boolean;
    created_by?: Types.ObjectId;
    updated_by?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

const FEATURE_SCHEMA = new Schema(
    {
        feature_name: {
            type: String,
            required: [true, "Feature name is required"],
            trim: true,
            minlength: [3, "Feature name must be at least 3 characters"],
            maxlength: [100, "Feature name cannot exceed 100 characters"]
        },

        feature_code: {
            type: String,
            required: [true, "Feature code is required"],
            trim: true,
            uppercase: true,
            minlength: [2, "Feature code must be at least 2 characters"],
            maxlength: [50, "Feature code cannot exceed 50 characters"],
            match: [
                /^[A-Z0-9_]+$/,
                "Feature code must contain only uppercase letters, numbers, and underscores"
            ],
            unique: true
        },

        module_code: {
            type: String,
            required: [true, "Module code is required"],
            uppercase: true,
            minlength: [2, "Module code must be at least 2 characters"],
            maxlength: [50, "Module code cannot exceed 50 characters"]
        },

        route_path: {
            type: String,
            required: [true, "Route path is required"],
            trim: true,
            maxlength: [250, "Route path cannot exceed 250 characters"]
        },

        icon: {
            type: String,
            trim: true,
            maxlength: [50, "Icon name cannot exceed 50 characters"]
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



export const FEATURE_MODEL = model<IFeature>(
    "features",
    FEATURE_SCHEMA
);
