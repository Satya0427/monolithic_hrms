import mongoose, { Schema, Types, model } from "mongoose";

export type RoleScope = "PLATFORM" | "ORGANIZATION";
export interface IUserRoleMapping {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  role_code: string;
  scope: RoleScope;
  organization_id?: Types.ObjectId;
  is_primary: boolean;
  is_active: boolean;
  valid_from: Date;
  valid_to?: Date;
  assigned_by?: Types.ObjectId;
  reason?: string;
  metadata: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

const USER_ROLE_MAPPING_SCHEMA = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: [true, "User is required"],
      index: true
    },

    role_code: {
      type: String,
      required: [true, "Role code is required"],
      trim: true,
      uppercase: true,
      minlength: [3, "Role code must be at least 3 characters"],
      maxlength: [30, "Role code cannot exceed 30 characters"]
    },

    user_type: {
      type: String,
      required: [true, "Role scope is required"],
      enum: {
        values: ["PLATFORM", "ORGANIZATION"],
        message: "Scope must be PLATFORM or ORGANIZATION"
      }
    },

    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "organizations",
      required: [
        function (this: any) {
          return this.scope === "ORGANIZATION";
        },
        "Organization is required for organization-level roles"
      ]
    },

    is_primary: {
      type: Boolean,
      default: false
    },

    is_active: {
      type: Boolean,
      default: true
    },

    valid_from: {
      type: Date,
      default: Date.now
    },

    valid_to: {
      type: Date
    },

    assigned_by: {
      type: Schema.Types.ObjectId,
      ref: "users"
    },

    reason: {
      type: String,
      trim: true,
      maxlength: [250, "Reason cannot exceed 250 characters"]
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


const MAPPING_ROLE_USER_MODEL = mongoose.model<IUserRoleMapping>(
  "mapping_role_user",
  USER_ROLE_MAPPING_SCHEMA,
  "mapping_role_user"
);

export { MAPPING_ROLE_USER_MODEL };
