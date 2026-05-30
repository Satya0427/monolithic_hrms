import { Schema, model } from "mongoose";

const ROLE_PERMISSION_SCHEMA = new Schema(
  {
    role_code: {
      type: String,
      required: [true, "Role code is required"],
      trim: true,
      uppercase: true,
      minlength: [3, "Role code must be at least 3 characters"],
      maxlength: [30, "Role code cannot exceed 30 characters"],
      index: true
    },

    module_code: {
      type: String,
      required: [true, "Module code is required"],
      trim: true,
      uppercase: true,
      minlength: [2, "Module code must be at least 2 characters"],
      maxlength: [50, "Module code cannot exceed 50 characters"]
    },

    feature_code: {
      type: String,
      required: [true, "Feature code is required"],
      trim: true,
      uppercase: true,
      minlength: [2, "Feature code must be at least 2 characters"],
      maxlength: [50, "Feature code cannot exceed 50 characters"]
    },

    permissions: {
      view: {
        type: Boolean,
        default: false
      },

      create: {
        type: Boolean,
        default: false
      },

      update: {
        type: Boolean,
        default: false
      },

      delete: {
        type: Boolean,
        default: false
      },

      approve: {
        type: Boolean,
        default: false
      },

      export: {
        type: Boolean,
        default: false
      },

      import: {
        type: Boolean,
        default: false
      }
    },

    data_scope: {
      type: String,
      enum: {
        values: ["SELF", "TEAM", "DEPARTMENT", "ORGANIZATION", "ALL"],
        message: "Invalid data scope"
      },
      default: "SELF"
    },

    conditions: {
      type: Object,
      default: {}
      // Example: { department_only: true }
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
      type: Schema.Types.ObjectId,
      ref: "users"
    },

    updated_by: {
      type: Schema.Types.ObjectId,
      ref: "users"
    },

    metadata: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true
  }
);
