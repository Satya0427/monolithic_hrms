import mongoose, { Schema, Document, Types } from "mongoose";

/* =====================================================
   INTERFACES
===================================================== */

export interface IEmployeePersonalDetails {
    profileImage?: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    dob?: Date;
    gender: "MALE" | "FEMALE" | "other";
    address?: string;
    maritalStatus?: string;
    nationality?: string;
    password?: string; // For authentication purposes, if needed

}

export interface IEmployeeJobDetails {
    designation_id: Types.ObjectId;
    department_id: Types.ObjectId;
    joiningDate: Date;
    workEmail: string;
    reported_to?: Types.ObjectId;
    work_location?: string;
    workMode?: string;
    role_id?: Types.ObjectId;
    probationStartDate?: Date;
    probationEndDate?: Date;
    probationStatus?: string;
    probationNotes?: string;
    employee_id: Types.ObjectId;
    employmentType?: string;
    shift_id?: Types.ObjectId;
}

export interface IEmployeeEmergencyEmbedded {
    contactName: string;
    relation: string;
    phone: string;
}

export interface IEmployeeProfile extends Document {
    organization_id: Types.ObjectId;
    personal_details: IEmployeePersonalDetails;
    job_details: IEmployeeJobDetails;
    emergency_contact?: IEmployeeEmergencyEmbedded;
    is_active: boolean;
    is_deleted: boolean;
    created_by?: Types.ObjectId;
    updated_by?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

/* =====================================================
   PERSONAL DETAILS SCHEMA
===================================================== */

const EMPLOYEE_PERSONAL_SCHEMA = new Schema(
    {
        profileImage: {
            type: Types.ObjectId,
            ref: "profile_images.files" // GridFS bucket
        },

        firstName: {
            type: String,
            required: [true, "First name is required"],
            trim: true,
            minlength: [2, "First name must be at least 2 characters"],
            maxlength: [50, "First name cannot exceed 50 characters"]
        },

        lastName: {
            type: String,
            required: [true, "Last name is required"],
            trim: true,
            minlength: [2, "Last name must be at least 2 characters"],
            maxlength: [50, "Last name cannot exceed 50 characters"]
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: [100, "Email cannot exceed 100 characters"]
        },
        password: {
            type: String,
            minlength: [6, "Password must be at least 6 characters"],
        },

        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
            minlength: [10, "Phone number must be at least 10 digits"],
            maxlength: [15, "Phone number cannot exceed 15 digits"]
        },

        dob: {
            type: Date
        },

        gender: {
            type: String,
            required: [true, "Gender is required"],
            enum: {
                values: ["MALE", "FEMALE", "other"],
                message: "Invalid Gender"
            }
        },

        address: {
            type: String,
            trim: true,
            maxlength: [250, "Address cannot exceed 250 characters"]
        },

        maritalStatus: {
            type: String,
            trim: true,
            maxlength: [30, "Marital status cannot exceed 30 characters"]
        },

        nationality: {
            type: String,
            trim: true,
            maxlength: [50, "Nationality cannot exceed 50 characters"]
        }
    },
    { _id: false }
);

/* =====================================================
   JOB DETAILS SCHEMA
===================================================== */

const EMPLOYEE_JOB_SCHEMA = new Schema(
    {
        designation_id: {
            type: Types.ObjectId,
            ref: "designations",
            required: [true, "Designation is required"]
        },

        department_id: {
            type: Types.ObjectId,
            ref: "departments",
            required: [true, "Department is required"]
        },

        joiningDate: {
            type: Date,
            required: [true, "Joining date is required"]
        },

        workEmail: {
            type: String,
            required: [true, "Work email is required"],
            trim: true,
            lowercase: true,
            maxlength: [100, "Work email cannot exceed 100 characters"]
        },

        reported_to: {
            type: Types.ObjectId,
            ref: "employee_details"
        },

        work_location: {
            type: String,
            trim: true,
            maxlength: [100, "Work location cannot exceed 100 characters"]
        },

        workMode: {
            type: String,
            trim: true,
            maxlength: [50, "Work mode cannot exceed 50 characters"]
        },

        role_id: {
            type: Types.ObjectId,
            ref: "roles"
        },

        probationStartDate: {
            type: Date
        },

        probationEndDate: {
            type: Date
        },

        probationStatus: {
            type: String,
            trim: true,
            maxlength: [30, "Probation status cannot exceed 30 characters"]
        },

        probationNotes: {
            type: String,
            trim: true,
            maxlength: [500, "Probation notes cannot exceed 500 characters"]
        },

        employee_id: {
            type: String,
            required: [true, "Employee ID is required"],
            trim: true,
            minlength: [3, "Employee ID must be at least 3 characters"],
            maxlength: [30, "Employee ID cannot exceed 30 characters"]
        },

        employmentType: {
            type: String,
            trim: true,
            maxlength: [50, "Employment type cannot exceed 50 characters"]
        },

        shift_id: {
            type: Types.ObjectId,
            ref: "attendance_shifts"
        }
    },
    { _id: false }
);

/* =====================================================
   EMERGENCY CONTACT SCHEMA (EMBEDDED)
===================================================== */

const EMPLOYEE_EMERGENCY_SCHEMA = new Schema(
    {
        contactName: {
            type: String,
            required: [true, "Emergency contact name is required"],
            trim: true,
            minlength: [2, "Contact name must be at least 2 characters"],
            maxlength: [100, "Contact name cannot exceed 100 characters"]
        },

        relation: {
            type: String,
            required: [true, "Relation is required"],
            trim: true,
            maxlength: [50, "Relation cannot exceed 50 characters"]
        },

        phone: {
            type: String,
            required: [true, "Emergency contact phone is required"],
            trim: true,
            minlength: [10, "Phone number must be at least 10 digits"],
            maxlength: [15, "Phone number cannot exceed 15 digits"]
        }
    },
    { _id: false }
);

/* =====================================================
   EMPLOYEE PROFILE SCHEMA
===================================================== */

const EMPLOYEE_PROFILE_SCHEMA = new Schema(
    {
        organization_id: {
            type: Types.ObjectId,
            ref: "organizations",
            required: [true, "Organization reference is required"],
            index: true
        },

        personal_details: {
            type: EMPLOYEE_PERSONAL_SCHEMA,
            required: true
        },
        job_details: {
            type: EMPLOYEE_JOB_SCHEMA,
            required: true
        },

        emergency_contact: {
            type: EMPLOYEE_EMERGENCY_SCHEMA
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
            type: Types.ObjectId,
            ref: "users"
        },

        updated_by: {
            type: Types.ObjectId,
            ref: "users"
        }
    },
    {
        timestamps: true
    }
);

/* =====================================================
   MODEL
===================================================== */

const EMPLOYEE_PROFILE_MODEL = mongoose.model<IEmployeeProfile>(
    "employee_details",
    EMPLOYEE_PROFILE_SCHEMA,
    "employee_details"
);

export { EMPLOYEE_PROFILE_MODEL };
