// import mongoose, { Schema, Document } from 'mongoose';

// interface IPlatformModule extends Document {
//     module_name: string;
//     module_code: string;
//     description?: string;
//     icon?: string;
//     route?: string;
//     display_order: number;
//     module_type: 'CORE' | 'ADDON';
//     is_active: boolean;
//     is_deleted: boolean;
//     created_by?: mongoose.Schema.Types.ObjectId;
//     updated_by?: mongoose.Schema.Types.ObjectId;
//     metadata: any;
//     createdAt?: Date;
//     updatedAt?: Date;
// }

// const PLATFORM_MODULE_SCHEMA = new Schema<IPlatformModule>(
//     {
//         // ===== Module Identity =====
//         module_name: {
//             type: String,
//             required: [true, "Module name is required"],
//             trim: true,
//             unique: true,
//             minlength: [3, "Module name must be at least 3 characters"],
//             maxlength: [50, "Module name cannot exceed 50 characters"]
//         },

//         module_code: {
//             type: String,
//             required: [true, "Module code is required"],
//             trim: true,
//             uppercase: true,
//             unique: true,
//             minlength: [2, "Module code must be at least 2 characters"],
//             maxlength: [30, "Module code cannot exceed 30 characters"]
//         },

//         description: {
//             type: String,
//             required: false,
//             trim: true,
//             maxlength: [250, "Description cannot exceed 250 characters"]
//         },

//         // ===== UI Support =====
//         icon: {
//             type: String,
//             required: false
//         },

//         route: {
//             type: String,
//             required: false
//         },

//         display_order: {
//             type: Number,
//             default: 0
//         },

//         // ===== Module Type =====
//         module_type: {
//             type: String,
//             enum: ["CORE", "ADDON"],
//             default: "CORE"
//         },

//         // ===== Platform Control =====
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

// const PLATFORM_MODULE_MODEL = mongoose.model<IPlatformModule>(
//     "platform_modules",
//     PLATFORM_MODULE_SCHEMA,
//     "platform_modules"
// );

// export { PLATFORM_MODULE_MODEL, IPlatformModule };
