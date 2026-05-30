// import mongoose, { Schema, Document } from 'mongoose';

// interface IOrganizationModule extends Document {
//     organization_id: mongoose.Schema.Types.ObjectId;
//     module_id: mongoose.Schema.Types.ObjectId;
//     is_enabled: boolean;
//     enabled_from?: Date;
//     enabled_till?: Date;
//     enabled_via: 'PLAN' | 'OVERRIDE' | 'TRIAL' | 'PROMOTION';
//     is_active: boolean;
//     is_deleted: boolean;
//     created_by?: mongoose.Schema.Types.ObjectId;
//     updated_by?: mongoose.Schema.Types.ObjectId;
//     metadata: any;
//     createdAt?: Date;
//     updatedAt?: Date;
// }

// const ORGANIZATION_MODULE_SCHEMA = new Schema<IOrganizationModule>(
//     {
//         // ===== References =====
//         organization_id: {
//             type: Schema.Types.ObjectId,
//             ref: "organizations",
//             required: [true, "Organization ID is required"],
//             index: true
//         },

//         module_id: {
//             type: Schema.Types.ObjectId,
//             ref: "platform_modules",
//             required: [true, "Module ID is required"],
//             index: true
//         },

//         // ===== Module Access =====
//         is_enabled: {
//             type: Boolean,
//             default: true
//         },

//         enabled_from: {
//             type: Date,
//             required: false
//         },

//         enabled_till: {
//             type: Date,
//             required: false
//         },

//         // ===== Source of Enablement =====
//         enabled_via: {
//             type: String,
//             enum: ["PLAN", "OVERRIDE", "TRIAL", "PROMOTION"],
//             default: "PLAN"
//         },

//         // ===== Control Flags =====
//         is_active: {
//             type: Boolean,
//             default: true
//         },

//         is_deleted: {
//             type: Boolean,
//             default: false
//         },

//         // ===== Audit =====
//         created_by: {
//             type: Schema.Types.ObjectId,
//             ref: "users"
//         },

//         updated_by: {
//             type: Schema.Types.ObjectId,
//             ref: "users"
//         },

//         // ===== Future Flexibility =====
//         metadata: {
//             type: Object,
//             default: {}
//         }
//     },
//     {
//         timestamps: true
//     }
// );

// const ORGANIZATION_MODULE_MODEL = mongoose.model<IOrganizationModule>(
//     "organization_modules",
//     ORGANIZATION_MODULE_SCHEMA,
//     "organization_modules"
// );

// export { ORGANIZATION_MODULE_MODEL, IOrganizationModule };
