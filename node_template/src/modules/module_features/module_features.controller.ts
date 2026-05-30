import { Request, Response } from 'express';
import { async_error_handler } from '../../common/utils/async_error_handler';
import { apiResponse, apiDataResponse } from '../../common/utils/api_response';
import { MESSAGES } from '../../common/utils/messages';
// import { MODULE_FEATURES_MODEL } from '../../common/schemas/PlatformModules/module_features.schema';
import { safeValidate } from '../../common/utils/validation_middleware';
import {
    createModuleFeaturesSchema,
    getModuleFeaturesSchema,
    listModuleFeaturesSchema,
    updateModuleFeaturesSchema,
    CreateModuleFeaturesInput,
    UpdateModuleFeaturesInput
} from './module_features.validatior';
import mongoose, { Types } from 'mongoose';
import { FEATURE_MODEL } from '../../common/schemas/PlatformModules/feature.schema';
import { MODULE_MODEL } from '../../common/schemas/PlatformModules/modules.schema';
import { MAPPING_ROLE_USER_MODEL } from '../../common/schemas/rcab/user_role_mapping.schema'
interface CustomRequest extends Request {
    user?: {
        user_id: string;
        session_id: string;
    };
}

const buildModulePayload = (
    data: CreateModuleFeaturesInput,
    userId?: string
) => {
    return {
        module_name: data.body.module_name,
        module_code: data.body.module_code,
        description: data.body.description,
        icon: data.body.icon,
        display_order: data.body.display_order ?? 0,
        is_active: data.body.is_active ?? true,
        is_deleted: false,
        created_by: userId ? new mongoose.Types.ObjectId(userId) : undefined
    };
};

const buildFeaturesPayload = (
    data: CreateModuleFeaturesInput,
    userId?: string
) => {
    return data.body.features.map(feature => ({
        feature_name: feature.name,
        feature_code: feature.code,
        route_path: feature.route_path,
        module_code: data.body.module_code,
        icon: feature.icon,
        is_active: feature.is_active ?? true,
        is_deleted: false,
        created_by: userId ? new mongoose.Types.ObjectId(userId) : undefined
    }));
};




//   CREATE MODULE FEATURES
const createModuleFeaturesAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {

    // 1. Validate request
    const validation = safeValidate(createModuleFeaturesSchema, { body: req.body });
    if (!validation.success) {
        res.status(400).json(apiDataResponse(400, 'Validation failed', validation.errors?.[0]?.message));
    }
    const validatedData = validation.data as CreateModuleFeaturesInput;
    // 2. Check module code uniqueness
    const existingModule = await MODULE_MODEL.findOne({
        module_code: validatedData.body.module_code,
        is_deleted: false
    });

    if (existingModule) {
        res.status(400).json(apiDataResponse(400, 'Module code already exists', null));
    }
    // 3. Start MongoDB transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // 4. Create Module
        const modulePayload = buildModulePayload(
            validatedData,
            req.user?.user_id
        );

        const [module] = await MODULE_MODEL.create(
            [modulePayload],
            { session }
        );

        // 5. Create Features
        const featuresPayload = buildFeaturesPayload(
            validatedData,
            req.user?.user_id
        );

        const features = await FEATURE_MODEL.create(
            featuresPayload,
            { session }
        );

        // 6. Commit transaction
        await session.commitTransaction();
        session.endSession();

        res.status(201).json(apiDataResponse(200, MESSAGES.SUCCESS, { module, features }));

    } catch (error) {
        // Rollback on error
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}
);

// const createModuleFeaturesAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
//     const validation = safeValidate(createModuleFeaturesSchema, { body: req.body });
//     if (!validation.success) {
//         res.status(400).json(apiDataResponse(400, 'Validation failed', validation.errors?.[0]?.message));
//     }
//     const validatedData = validation.data as CreateModuleFeaturesInput;
//     const existingModule = await MODULE_FEATURES_MODEL.findOne({
//         module_code: validatedData.body.module_code,
//         is_deleted: false
//     });
//     if (existingModule) {
//         res.status(400).json(apiDataResponse(400, 'Module code already exists', null));
//     }
//     const payload = buildModuleFeaturesPayload(
//         validatedData,
//         req.user?.user_id
//     );
//     const moduleFeatures = await MODULE_FEATURES_MODEL.create(payload);
//     res.status(201).json(apiDataResponse(201, MESSAGES.SUCCESS, moduleFeatures));
// }
// );


/**
 * GET MODULE FEATURES BY ID
 */
// const getModuleFeaturesAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
//     // Validate params
//     const validation = safeValidate(getModuleFeaturesSchema, req.params);

//     if (!validation.success) {
//         res.status(400).json(
//             apiDataResponse(400, 'Validation failed', validation.errors?.[0]?.message)
//         );
//         return;
//     }

//     const { moduleId } = validation.data || { moduleId: '' };

//     const moduleFeatures = await MODULE_FEATURES_MODEL.findOne({
//         _id: moduleId,
//         is_deleted: false
//     });

//     if (!moduleFeatures) {
//         res.status(404).json(apiResponse(404, "Module features not found"));
//         return;
//     }

//     res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, moduleFeatures));
// });

/**
 * LIST MODULE FEATURES (Pagination + Filters)
 */
// const listModuleFeaturesAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {

//     const modules = await MODULE_FEATURES_MODEL
//         .find({ is_deleted: false })
//         .sort({ createdAt: 1 }) // keeps order stable
//         .lean(); // returns plain JSON
//     res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, modules));
// }
// );
const listModuleFeaturesAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    // const modulesWithFeatures = await MODULE_MODEL.aggregate([
    //     // Only active modules
    //     {
    //         $match: {
    //             is_deleted: false,
    //             is_active: true
    //         }
    //     },
    //     // Sort modules (sidebar order)
    //     {
    //         $sort: {
    //             display_order: 1,
    //             createdAt: 1
    //         }
    //     },
    //     //  Join features
    //     {
    //         $lookup: {
    //             from: 'features',
    //             let: { moduleCode: '$module_code' },
    //             pipeline: [
    //                 {
    //                     $match: {
    //                         $expr: {
    //                             $and: [
    //                                 { $eq: ['$module_code', '$$moduleCode'] },
    //                                 { $eq: ['$is_deleted', false] },
    //                                 { $eq: ['$is_active', true] }
    //                             ]
    //                         }
    //                     }
    //                 },
    //                 {
    //                     $sort: { createdAt: 1 }
    //                 }
    //             ],
    //             as: 'features'
    //         }
    //     },
    //     // Transform to sidebar format
    //     {
    //         $project: {
    //             _id: 1,
    //             label: '$module_name',
    //             icon: '$icon',
    //             active: { $literal: false },
    //             expanded: { $literal: false },
    //             subItems: {
    //                 $map: {
    //                     input: '$features',
    //                     as: 'feature',
    //                     in: {
    //                         id: '$$feature._id',
    //                         label: '$$feature.feature_name',
    //                         route: '$$feature.route_path',
    //                         icon: '$$feature.icon',
    //                         active: { $literal: false }
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // ]);
    const modulesWithFeatures = await MODULE_MODEL.aggregate([
        { $match: { is_active: true, is_deleted: false } },
        {
            $lookup: {
                from: "features",
                localField: "module_code",
                foreignField: "module_code",
                as: "features"
            }
        }
    ]);
    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, modulesWithFeatures));
}
);

const getRoleBasedModulesAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {

    const { user_type, organization_id } = req.body;
    const user_id = req.user?.user_id;

    /* =====================================================
       1️⃣ Validate User → Role Mapping
    ====================================================== */
    const userRole: any = await MAPPING_ROLE_USER_MODEL.findOne({
        user_id: new Types.ObjectId(user_id),
        user_type,
        is_active: true,
        ...(user_type === "ORGANIZATION" && {
            organization_id: new Types.ObjectId(organization_id)
        })
    }).lean();

    if (!userRole) {
        res.status(403).json(apiResponse(403, "Role not assigned to user"));
    }

    const role_code = userRole.role_code;

    /* =====================================================
       2️⃣ Aggregate Modules → Features → Permissions
    ====================================================== */
    const modules = await MODULE_MODEL.aggregate([
        {
            $match: {
                is_active: true,
                is_deleted: false
            }
        },
        {
            $sort: {
                display_order: 1,
                createdAt: 1
            }
        },
        {
            $lookup: {
                from: "features",
                let: { moduleCode: "$module_code" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$module_code", "$$moduleCode"] },
                                    { $eq: ["$is_active", true] },
                                    { $eq: ["$is_deleted", false] }
                                ]
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: "role_permissions",
                            let: {
                                featureCode: "$feature_code",
                                moduleCode: "$module_code"
                            },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$role_code", role_code] },
                                                { $eq: ["$module_code", "$$moduleCode"] },
                                                { $eq: ["$feature_code", "$$featureCode"] },
                                                { $eq: ["$is_active", true] }
                                            ]
                                        }
                                    }
                                }
                            ],
                            as: "permission"
                        }
                    },
                    {
                        $addFields: {
                            permission: { $arrayElemAt: ["$permission", 0] }
                        }
                    },
                    {
                        $match: {
                            "permission.can_view": true
                        }
                    }
                ],
                as: "features"
            }
        },
        {
            $match: {
                "features.0": { $exists: true }
            }
        },
        {
            $project: {
                _id: 1,
                label: "$module_name",
                icon: "$icon",
                active: { $literal: false },
                expanded: { $literal: false },
                subItems: {
                    $map: {
                        input: "$features",
                        as: "feature",
                        in: {
                            id: "$$feature._id",
                            label: "$$feature.feature_name",
                            route: "$$feature.route_path",
                            icon: "$$feature.icon",
                            active: { $literal: false }
                        }
                    }
                }
            }
        }
    ]);
    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, modules));
}
);




/**
 * UPDATE MODULE FEATURES
 */
// const updateModuleFeaturesAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
//     // Validate params and body
//     const validation = safeValidate(updateModuleFeaturesSchema, {
//         moduleId: req.params.moduleId,
//         ...req.body
//     });

//     if (!validation.success) {
//         res.status(400).json(
//             apiDataResponse(400, 'Validation failed', validation.errors?.[0]?.message)
//         );
//         return;
//     }

//     const { moduleId, ...updateData } = validation.data || { moduleId: '' };
//     const validatedData = updateData as UpdateModuleFeaturesInput;

//     // Check if trying to update module_code and if it already exists
//     if (validatedData.module_code) {
//         const existingModule = await MODULE_FEATURES_MODEL.findOne({
//             module_code: validatedData.module_code,
//             _id: { $ne: moduleId },
//             is_deleted: false
//         });

//         if (existingModule) {
//             res.status(400).json(apiDataResponse(400, 'Module code already exists', null));
//             return;
//         }
//     }

//     const updatedModule = await MODULE_FEATURES_MODEL.findOneAndUpdate(
//         { _id: moduleId, is_deleted: false },
//         { ...validatedData, updated_by: req.user?.user_id },
//         { new: true, runValidators: true }
//     );

//     if (!updatedModule) {
//         res.status(404).json(apiResponse(404, "Module features not found"));
//         return;
//     }

//     res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, updatedModule));
// });

/**
 * DELETE MODULE FEATURES (Soft Delete)
 */
// const deleteModuleFeaturesAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
//     // Validate params
//     const validation = safeValidate(getModuleFeaturesSchema, req.params);

//     if (!validation.success) {
//         res.status(400).json(
//             apiDataResponse(400, 'Validation failed', validation.errors?.[0]?.message)
//         );
//         return;
//     }

//     const { moduleId } = validation.data || { moduleId: '' };

//     const deletedModule = await MODULE_FEATURES_MODEL.findOneAndUpdate(
//         { _id: moduleId, is_deleted: false },
//         { is_deleted: true, updated_by: req.user?.user_id },
//         { new: true }
//     );

//     if (!deletedModule) {
//         res.status(404).json(apiResponse(404, "Module features not found"));
//         return;
//     }

//     res.status(200).json(apiDataResponse(200, 'Module features deleted successfully', deletedModule));
// });

export {
    createModuleFeaturesAPIHandler,
    // getModuleFeaturesAPIHandler,
    listModuleFeaturesAPIHandler,
    getRoleBasedModulesAPIHandler
    // updateModuleFeaturesAPIHandler,
    // deleteModuleFeaturesAPIHandler
};
