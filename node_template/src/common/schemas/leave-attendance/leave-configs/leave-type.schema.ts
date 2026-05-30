import mongoose from "mongoose";

interface IleaveType {
    organization_id: mongoose.Types.ObjectId;
    name: string;
    code: string;
    category: 'PAID' | 'UNPAID';
    color?: string;
    description?: string;
    is_system?: boolean;
    is_active?: boolean;
}
const LEAVE_TYPE_SCHEMA = new mongoose.Schema(
    {
        organization_id: { type: mongoose.Types.ObjectId, required: true },

        name: { type: String, required: true },          // Casual Leave
        code: { type: String, required: true },          // CL
        category: {
            type: String,
            enum: ['PAID', 'UNPAID'],
            required: true
        },

        color: { type: String },                          // calendar color
        description: { type: String },

        is_system: { type: Boolean, default: false },     // LOP etc
        is_active: { type: Boolean, default: true }
    },
    { timestamps: true }
);

LEAVE_TYPE_SCHEMA.index({ organization_id: 1, code: 1 }, { unique: true });

// USER_SCHEMA.index({ employee_id: 1 });
const LEAVE_TYPE_MODEL = mongoose.model<IleaveType>(
    "leave_type",
    LEAVE_TYPE_SCHEMA,
    "leave_type"
);

export { LEAVE_TYPE_MODEL };