// import mongoose, { Schema, Document } from 'mongoose';

// interface IUsageLimit extends Document {
//     organization_id: mongoose.Schema.Types.ObjectId;
//     subscription_id: mongoose.Schema.Types.ObjectId;
//     usage: {
//         employees_count: number;
//         active_users_count: number;
//         storage_used_gb: number;
//         api_calls_count: number;
//     };
//     limits: {
//         max_employees?: number;
//         max_users?: number;
//         max_storage_gb?: number;
//         max_api_calls?: number;
//     };
//     alert_threshold_percentage: number;
//     is_limit_exceeded: boolean;
//     last_calculated_at?: Date;
//     is_active: boolean;
//     is_deleted: boolean;
//     created_by?: mongoose.Schema.Types.ObjectId;
//     updated_by?: mongoose.Schema.Types.ObjectId;
//     metadata: any;
//     createdAt?: Date;
//     updatedAt?: Date;
// }

// const USAGE_LIMIT_SCHEMA = new Schema<IUsageLimit>(
//     {
//         // ===== References =====
//         organization_id: {
//             type: Schema.Types.ObjectId,
//             ref: "organizations",
//             required: [true, "Organization ID is required"],
//             index: true
//         },

//         subscription_id: {
//             type: Schema.Types.ObjectId,
//             ref: "organization_subscriptions",
//             required: true
//         },

//         // ===== Usage Tracking =====
//         usage: {
//             employees_count: {
//                 type: Number,
//                 default: 0
//             },

//             active_users_count: {
//                 type: Number,
//                 default: 0
//             },

//             storage_used_gb: {
//                 type: Number,
//                 default: 0
//             },

//             api_calls_count: {
//                 type: Number,
//                 default: 0
//             }
//         },

//         // ===== Limits Snapshot =====
//         limits: {
//             max_employees: {
//                 type: Number,
//                 required: false
//             },

//             max_users: {
//                 type: Number,
//                 required: false
//             },

//             max_storage_gb: {
//                 type: Number,
//                 required: false
//             },

//             max_api_calls: {
//                 type: Number,
//                 required: false
//             }
//         },

//         // ===== Alerts & Enforcement =====
//         alert_threshold_percentage: {
//             type: Number,
//             default: 80
//         },

//         is_limit_exceeded: {
//             type: Boolean,
//             default: false
//         },

//         last_calculated_at: {
//             type: Date,
//             required: false
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

// const USAGE_LIMIT_MODEL = mongoose.model<IUsageLimit>(
//     "usage_limits",
//     USAGE_LIMIT_SCHEMA,
//     "usage_limits"
// );

// export { USAGE_LIMIT_MODEL, IUsageLimit };
