import mongoose from "mongoose";

const ATTENDANCE_REGULARIZATION_SCHEMA = new mongoose.Schema(
    {
        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },

        employee_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },

        attendance_date: {
            type: Date, // The date employee is requesting correction for
            required: true,
            index: true,
        },

        // =============================
        // EXISTING ATTENDANCE SNAPSHOT
        // =============================
        existing_clock_in: {
            type: Date,
            default: null,
        },

        existing_clock_out: {
            type: Date,
            default: null,
        },

        // =============================
        // REQUESTED CORRECTION
        // =============================
        requested_clock_in: {
            type: Date,
            required: true,
        },

        requested_clock_out: {
            type: Date,
            required: true,
        },

        request_type: {
            type: String,
            enum: [
                "MISSED_PUNCH",
                "WRONG_PUNCH",
                "HALF_DAY",
                "WFH",
                "LATE_COMING",
                "EARLY_GOING",
                "OTHER"
            ],
            required: true,
        },

        reason: {
            type: String,
            required: true,
        },

        supporting_documents: [
            {
                file_name: String,
                file_url: String,
                uploaded_at: Date,
            },
        ],

        // =============================
        // APPROVAL WORKFLOW
        // =============================

        approval_status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
            default: "PENDING",
            index: true,
        },

        current_approver_id: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },

        approval_history: [
            {
                approver_id: mongoose.Schema.Types.ObjectId,
                decision: {
                    type: String,
                    enum: ["APPROVED", "REJECTED"],
                },
                remarks: String,
                action_date: Date,
            },
        ],

        final_decision_date: {
            type: Date,
            default: null,
        },

        // =============================
        // SYSTEM FLAGS
        // =============================

        is_applied_to_attendance: {
            type: Boolean,
            default: false,
        },

        applied_at: {
            type: Date,
            default: null,
        },

        is_cancelled: {
            type: Boolean,
            default: false,
        },

        cancelled_at: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true, // createdAt, updatedAt
    }
);

export default mongoose.model(
    "attendance_regularizations",
    ATTENDANCE_REGULARIZATION_SCHEMA
);
