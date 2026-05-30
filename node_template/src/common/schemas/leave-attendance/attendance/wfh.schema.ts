import mongoose from "mongoose";

const WFH_REQUEST_SCHEMA = new mongoose.Schema(
    {
        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },

        employee_id: {
            type: mongoose.Schema.Types.ObjectId,
            index: true
        },

        // Keep naming consistent with other attendance schemas
        employee_uuid: {
            type: String,
            required: true,
            index: true
        },

        // For which day the WFH is requested
        request_date: {
            type: Date,
            required: true,
            index: true
        },

        request_type: {
            type: String,
            enum: ["FULL_DAY", "HALF_DAY"],
            required: true
        },

        half_day_session: {
            type: String,
            enum: ["FIRST_HALF", "SECOND_HALF"],
            required: function () {
                return this.request_type === "HALF_DAY";
            }
        },

        reason: {
            type: String
        },

        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
            default: "PENDING",
            index: true
        },

        requested_at: {
            type: Date
        },

        reviewed_at: {
            type: Date
        },

        manager_id: {
            type: mongoose.Schema.Types.ObjectId,
            index: true
        },

        manager_comment: {
            type: String
        },

        is_active: {
            type: Boolean,
            default: true
        },

        created_by: {
            type: mongoose.Schema.Types.ObjectId
        },

        updated_by: {
            type: mongoose.Schema.Types.ObjectId
        }
    },
    { timestamps: true }
);

// Ensure only one request per employee per day
WFH_REQUEST_SCHEMA.index(
    { employee_uuid: 1, request_date: 1 },
    { unique: true }
);

export const WFH_REQUEST_MODEL = mongoose.model(
    "wfh_requests",
    WFH_REQUEST_SCHEMA,
    "wfh_requests"
);
