// import mongoose, { Schema, Document, Types } from 'mongoose';

// interface IFeature {
//     name: string;
//     code: string;
//     route_path: string;
//     active: boolean;
// }

// interface IModuleFeatures extends Document {
//     module_name: string;
//     module_code: string;
//     description?: string;
//     icon?: string;
//     active: boolean;
//     features: IFeature[];
//     is_deleted: boolean;
//     created_by?: Types.ObjectId
//     updated_by?: Types.ObjectId
//     createdAt?: Date;
//     updatedAt?: Date;
// }

// const FEATURE_SCHEMA = new Schema<IFeature>(
//     {
//         name: {
//             type: String,
//             required: [true, "Feature name is required"],
//             trim: true,
//             minlength: [1, "Feature name is required"],
//             maxlength: [100, "Feature name cannot exceed 100 characters"]
//         },

//         code: {
//             type: String,
//             required: [true, "Feature code is required"],
//             trim: true,
//             uppercase: true,
//             minlength: [1, "Feature code is required"],
//             maxlength: [50, "Feature code cannot exceed 50 characters"]
//         },

//         route_path: {
//             type: String,
//             required: [true, "Route path is required"],
//             trim: true,
//             maxlength: [250, "Route path cannot exceed 250 characters"]
//         },

//         active: {
//             type: Boolean,
//             default: true
//         }
//     },
//     { _id: false }
// );

// const MODULE_FEATURES_SCHEMA = new Schema<IModuleFeatures>(
//     {
//         // ===== Module Identity =====
//         module_name: {
//             type: String,
//             required: [true, "Module name is required"],
//             trim: true,
//             minlength: [3, "Module name must be at least 3 characters"],
//             maxlength: [100, "Module name cannot exceed 100 characters"]
//         },

//         module_code: {
//             type: String,
//             required: [true, "Module code is required"],
//             trim: true,
//             uppercase: true,
//             minlength: [1, "Module code is required"],
//             maxlength: [50, "Module code cannot exceed 50 characters"]
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
//             required: false,
//             maxlength: [50, "Icon name cannot exceed 50 characters"]
//         },

//         // ===== Module Features Array =====
//         features: {
//             type: [FEATURE_SCHEMA],
//             required: [true, "Features are required"],
//             validate: {
//                 validator: function(v: IFeature[]) {
//                     return v && v.length > 0;
//                 },
//                 message: "At least one feature is required"
//             }
//         },

//         // ===== Module Status =====
//         active: {
//             type: Boolean,
//             default: true
//         },

//         // ===== Platform Control =====
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
//         }
//     },
//     {
//         timestamps: true
//     }
// );

// const MODULE_FEATURES_MODEL = mongoose.model<IModuleFeatures>(
//     "module_features",
//     MODULE_FEATURES_SCHEMA,
//     "module_features"
// );

// export { MODULE_FEATURES_MODEL, IModuleFeatures, IFeature };
