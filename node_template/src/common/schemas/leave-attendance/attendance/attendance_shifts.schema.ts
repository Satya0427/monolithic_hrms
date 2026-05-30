import mongoose from "mongoose";

const ATTENDANCE_SHIFT_SCHEMA = new mongoose.Schema(
    {
        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },

        shift_name: {
            type: String,
            required: true
        },

        start_time: {
            type: String,  // "09:00"
            required: true
        },

        end_time: {
            type: String,  // "18:00"
            required: true
        },

        grace_minutes: {
            type: Number,
            default: 0
        },

        working_hours: {
            type: Number   // e.g. 8
        },

        weekly_off_pattern: {
            type: String
        },

        is_active: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

export const ATTENDANCE_SHIFT_MODEL = mongoose.model(
    "attendance_shifts",
    ATTENDANCE_SHIFT_SCHEMA,
    "attendance_shifts"
);
