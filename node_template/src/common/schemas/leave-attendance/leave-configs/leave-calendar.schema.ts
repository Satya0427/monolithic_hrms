import mongoose from "mongoose";

const HOLIDAYS_SCHEMA = new mongoose.Schema(
    {
        holiday_id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
        name: { type: String, required: true },
        date: { type: Date, required: true },

        type: {
            type: String,
            enum: ['NATIONAL', 'FESTIVAL', 'COMPANY'],
            required: true
        },
        
        is_optional: { type: Boolean, default: false },
        is_paid: { type: Boolean, default: true },

        color: String,

        applicable_to: {
            type: String,
            enum: ['ALL', 'SPECIFIC'],
            default: 'ALL'
        },

        applicable_locations: [{ type: String }], // empty = all
        applicable_departments: [{ type: String }],
        applicable_employee_types: [{ type: String }],
        applicable_gender: [{ type: String }],

        optional_holiday_rules: {
            max_optional_leaves: { type: Number, default: 0 },
            requires_approval: { type: Boolean, default: false },
            auto_credit_leave: { type: Boolean, default: false },
            allow_carry_forward: { type: Boolean, default: false }
        },

        description: String,

        is_active: { type: Boolean, default: true }
    },
    { _id: false }
);
const WEEKLY_OFF_SCHEMA = new mongoose.Schema(
    {
        week: { type: Number, min: 1, max: 5 }, // 1st, 2nd, etc
        days: {
            mon: Boolean,
            tue: Boolean,
            wed: Boolean,
            thu: Boolean,
            fri: Boolean,
            sat: Boolean,
            sun: Boolean
        }
    },
    { _id: false }
);

const LEAVE_CALENDAR_SCHEMA = new mongoose.Schema(
    {
        organization_id: { type: mongoose.Types.ObjectId, required: true },
        year: { type: Number, required: true },

        holidays: [HOLIDAYS_SCHEMA],

        weekly_off_policy: {
            policy_id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
            policy_name: String,
            effective_from: Date,
            applicable_employees: {
                type: String,
                enum: ['ALL', 'GROUP'],
                default: 'ALL'
            },
            weeks: [WEEKLY_OFF_SCHEMA]
        }
    },
    { timestamps: true }
);

LEAVE_CALENDAR_SCHEMA.index(
    { organization_id: 1, year: 1 },
    { unique: true }
);

// USER_SCHEMA.index({ employee_id: 1 });
const LEAVE_CALENDAR_MODEL = mongoose.model(
    "leave_calendar",
    LEAVE_CALENDAR_SCHEMA,
    "leave_calendar"
);

export { LEAVE_CALENDAR_MODEL };

