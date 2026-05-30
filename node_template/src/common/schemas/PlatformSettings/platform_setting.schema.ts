import mongoose, { Schema, Document } from 'mongoose';

interface IPlatformSetting extends Document {
    setting_key: string;
    setting_value: any;
    description?: string;
    category: 'SECURITY' | 'AUTH' | 'SUBSCRIPTION' | 'EMAIL' | 'STORAGE' | 'FEATURE' | 'SYSTEM';
    data_type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
    scope: 'PLATFORM';
    is_editable: boolean;
    is_active: boolean;
    is_deleted: boolean;
    created_by?: mongoose.Schema.Types.ObjectId;
    updated_by?: mongoose.Schema.Types.ObjectId;
    metadata: any;
    createdAt?: Date;
    updatedAt?: Date;
}

const PLATFORM_SETTING_SCHEMA = new Schema<IPlatformSetting>(
    {
        // ===== Setting Identity =====
        setting_key: {
            type: String,
            required: [true, "Setting key is required"],
            trim: true,
            uppercase: true,
            unique: true,
            minlength: [3, "Setting key must be at least 3 characters"],
            maxlength: [100, "Setting key cannot exceed 100 characters"]
        },

        setting_value: {
            type: Schema.Types.Mixed,
            required: true
        },

        description: {
            type: String,
            required: false,
            trim: true,
            maxlength: [250, "Description cannot exceed 250 characters"]
        },

        // ===== Category (UI grouping) =====
        category: {
            type: String,
            required: true,
            enum: [
                "SECURITY",
                "AUTH",
                "SUBSCRIPTION",
                "EMAIL",
                "STORAGE",
                "FEATURE",
                "SYSTEM"
            ],
            default: "SYSTEM"
        },

        // ===== Data Type =====
        data_type: {
            type: String,
            required: true,
            enum: ["STRING", "NUMBER", "BOOLEAN", "JSON"]
        },

        // ===== Scope =====
        scope: {
            type: String,
            enum: ["PLATFORM"],
            default: "PLATFORM"
        },

        // ===== Control Flags =====
        is_editable: {
            type: Boolean,
            default: true
        },

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

const PLATFORM_SETTING_MODEL = mongoose.model<IPlatformSetting>(
    "platform_settings",
    PLATFORM_SETTING_SCHEMA,
    "platform_settings"
);

export { PLATFORM_SETTING_MODEL, IPlatformSetting };
