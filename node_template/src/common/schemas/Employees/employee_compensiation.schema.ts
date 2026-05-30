import mongoose, { Schema, Types } from "mongoose";

/* =====================================================
   ALLOWANCE EMBEDDED SCHEMA
===================================================== */

const COMPENSATION_ALLOWANCE_EMBEDDED_SCHEMA = new Schema(
  {
    name: {
      type: String,
      required: [true, "Allowance name is required"],
      trim: true,
      maxlength: [50, "Allowance name cannot exceed 50 characters"],
    },

    amount: {
      type: Number,
      required: [true, "Allowance amount is required"],
      min: [0, "Allowance amount cannot be negative"],
    },

    taxable: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

/* =====================================================
   DEDUCTION EMBEDDED SCHEMA
===================================================== */

const COMPENSATION_DEDUCTION_EMBEDDED_SCHEMA = new Schema(
  {
    name: {
      type: String,
      required: [true, "Deduction name is required"],
      trim: true,
      maxlength: [50, "Deduction name cannot exceed 50 characters"],
    },

    amount: {
      type: Number,
      required: [true, "Deduction amount is required"],
      min: [0, "Deduction amount cannot be negative"],
    },
  },
  { _id: false }
);

/* =====================================================
   EMPLOYEE COMPENSATION SCHEMA (TOP-LEVEL)
===================================================== */

const EMPLOYEE_COMPENSATION_SCHEMA = new Schema(
  {
    pay_structure: {
      type: String,
      enum: ["MONTHLY", "ANNUAL"],
      required: true,
    },

    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    employee_uuid: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
      maxlength: 10,
    },

    basic: { type: Number, required: true, min: 0 },
    hra: { type: Number, min: 0 },
    special_allowance: { type: Number, min: 0 },

    allowances: {
      type: [COMPENSATION_ALLOWANCE_EMBEDDED_SCHEMA],
      default: [],
    },

    deductions: {
      type: [COMPENSATION_DEDUCTION_EMBEDDED_SCHEMA],
      default: [],
    },

    gross_salary: { type: Number, required: true, min: 0 },
    total_deductions: { type: Number, required: true, min: 0 },
    net_salary: { type: Number, required: true, min: 0 },
    ctc: { type: Number, required: true, min: 0 },

    effective_from: {
      type: Date,
      required: true,
    },

    effective_to: {
      type: Date,
    },

    is_active: {
      type: Boolean,
      default: true,
    },

    created_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updated_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

/* =====================================================
   MODEL  (⚠️ NO GENERIC HERE)
===================================================== */

const EMPLOYEE_COMPENSATION_MODEL = mongoose.model(
  "employee_compensations",
  EMPLOYEE_COMPENSATION_SCHEMA,
  "employee_compensations"
);

export { EMPLOYEE_COMPENSATION_MODEL };
