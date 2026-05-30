import mongoose, { Schema, Document, Types } from "mongoose";

/* =====================================================
   INTERFACES
===================================================== */

export interface IDocumentFormValues {
    docName: string;
    docId?: string;
    dob?: Date;
    issueDate?: Date;
    expiryDate?: Date;
}

export interface IEmployeeDocument extends Document {
    organization_id: Types.ObjectId;
    employee_uuid: Types.ObjectId;
    document_type: string;
    file_id: Types.ObjectId; // GridFS file _id
    form_values: IDocumentFormValues;
    status: "ACTIVE" | "EXPIRED" | "DELETED";
    is_verified: boolean;
    created_by?: Types.ObjectId;
    updated_by?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

/* =====================================================
   DOCUMENT FORM VALUES SCHEMA
===================================================== */

const DOCUMENT_FORM_VALUES_SCHEMA = new Schema(
    {
        docName: {
            type: String,
            required: [true, "Document name is required"],
            trim: true,
            maxlength: [100, "Document name cannot exceed 100 characters"]
        },

        docId: {
            type: String,
            trim: true,
            maxlength: [50, "Document ID cannot exceed 50 characters"]
        },

        dob: {
            type: Date
        },

        issueDate: {
            type: Date
        },

        expiryDate: {
            type: Date
        }
    },
);

/* =====================================================
   EMPLOYEE DOCUMENTS SCHEMA
===================================================== */

const EMPLOYEE_DOCUMENT_SCHEMA = new Schema(
    {
        organization_id: {
            type: Types.ObjectId,
            ref: "organizations",
            required: [true, "Organization reference is required"],
            index: true
        },

        employee_uuid: {
            type: Types.ObjectId,
            ref: "users",
            required: [true, "User reference is required"],
            index: true
        },

        document_type: {
            type: String,
            required: [true, "Document type is required"],
            trim: true,
            maxlength: [50, "Document type cannot exceed 50 characters"],
            index: true
        },

        /* ================= GRIDFS FILE REFERENCE ================= */
        file_id: {
            type: Types.ObjectId,
            required: [true, "GridFS file reference is required"],
            ref: "documents.files" // GridFS bucket
        },

        /* ================= FORMGRID VALUES ================= */
        form_values: {
            type: DOCUMENT_FORM_VALUES_SCHEMA,
            required: true
        },

        /* ================= STATUS ================= */
        status: {
            type: String,
            enum: {
                values: ["ACTIVE", "EXPIRED", "DELETED"],
                message: "Invalid document status"
            },
            default: "ACTIVE",
            index: true
        },

        is_verified: {
            type: Boolean,
            default: false
        },

        /* ================= AUDIT ================= */
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

EMPLOYEE_DOCUMENT_SCHEMA.index({ organization_id: 1, user_id: 1 });
EMPLOYEE_DOCUMENT_SCHEMA.index({ document_type: 1 });
EMPLOYEE_DOCUMENT_SCHEMA.index({ status: 1 });
EMPLOYEE_DOCUMENT_SCHEMA.index({ "form_values.docId": 1 });

/* =====================================================
   MODEL
===================================================== */

const EMPLOYEE_DOCUMENT_MODEL = mongoose.model<IEmployeeDocument>(
    "employee_documents",
    EMPLOYEE_DOCUMENT_SCHEMA,
    "employee_documents"
);

export { EMPLOYEE_DOCUMENT_MODEL };

