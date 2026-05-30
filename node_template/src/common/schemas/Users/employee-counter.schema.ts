import mongoose, { Schema, Document } from 'mongoose';

interface IEmployeeCounter extends Document {
    organization_id: mongoose.Types.ObjectId;
    seq: number;
}

const EMPLOYEE_COUNTER_SCHEMA = new Schema<IEmployeeCounter>({
    organization_id: {
        type: Schema.Types.ObjectId,
        required: true,
        unique: true
    },
    seq: {
        type: Number,
        default: 0
    }
});

export const EMPLOYEE_COUNTER_MODEL = mongoose.model<IEmployeeCounter>(
    'employee_counters',
    EMPLOYEE_COUNTER_SCHEMA
);
