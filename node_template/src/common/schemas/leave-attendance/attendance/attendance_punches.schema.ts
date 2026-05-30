import mongoose from "mongoose";

const ATTENDANCE_PUNCH_SCHEMA = new mongoose.Schema(
    {
        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },

        employee_uuid: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },

        punch_time: {
            type: Date,
            required: true,
            index: true
        },

        punch_type: {
            type: String,
            enum: ['IN', 'OUT'],
            required: true
        },

        source: {
            type: String,
            enum: ['WEB', 'MOBILE', 'BIOMETRIC', 'API'],
            required: true
        },

        device_info: String,

        geo_location: {
            lat: Number,
            lng: Number
        },

        is_manual_entry: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

ATTENDANCE_PUNCH_SCHEMA.index({
    employee_uuid: 1,
    punch_time: 1
});

export const ATTENDANCE_PUNCH_MODEL = mongoose.model(
    "attendance_punches",
    ATTENDANCE_PUNCH_SCHEMA,
    "attendance_punches"
);
