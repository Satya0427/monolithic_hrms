// import { Request, Response } from 'express';
// import { async_error_handler } from '../../../common/utils/async_error_handler';
// import { apiResponse, apiDataResponse } from '../../../common/utils/api_response';
// import { MESSAGES } from '../../../common/utils/messages';
// import { PERMISSION_MODEL } from '../../../common/schemas/rcab/role_permissions.schema';

// interface CustomRequest extends Request {
//     user?: any;
// }

// /**
//  * CREATE PERMISSION
//  */
// const createPermissionAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
//     const permission = await PERMISSION_MODEL.create({
//         ...req.body,
//         created_by: req.user?.user_id
//     });

//     res.status(201).json(apiDataResponse(201, MESSAGES.SUCCESS, permission));
// });

// /**
//  * GET PERMISSION BY ID
//  */
// const getPermissionByIdAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
//     const { permissionId } = req.params;

//     const permission = await PERMISSION_MODEL.findOne({
//         _id: permissionId,
//         is_deleted: false
//     });

//     if (!permission) {
//         res.status(404).json(apiResponse(404, "Permission not found"));
//         return;
//     }

//     res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, permission));
// });

// /**
//  * LIST PERMISSIONS
//  */
// const listPermissionsAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
//     const page = Number(req.query.page) || 1;
//     const limit = Number(req.query.limit) || 10;
//     const scope = req.query.scope as string | undefined;

//     const query: any = { is_deleted: false };
//     if (scope) query.scope = scope;

//     const permissions = await PERMISSION_MODEL.find(query)
//         .skip((page - 1) * limit)
//         .limit(limit)
//         .sort({ createdAt: -1 });

//     const total = await PERMISSION_MODEL.countDocuments(query);

//     res.status(200).json(
//         apiDataResponse(200, MESSAGES.SUCCESS, {
//             data: permissions,
//             total,
//             page,
//             limit
//         })
//     );
// });

// /**
//  * UPDATE PERMISSION
//  */
// const updatePermissionAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
//     const { permissionId } = req.params;

//     const updatedPermission = await PERMISSION_MODEL.findOneAndUpdate(
//         { _id: permissionId, is_deleted: false },
//         { ...req.body, updated_by: req.user?.user_id },
//         { new: true }
//     );

//     if (!updatedPermission) {
//         res.status(404).json(apiResponse(404, "Permission not found"));
//         return;
//     }

//     res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, updatedPermission));
// });

// export {
//     createPermissionAPIHandler,
//     getPermissionByIdAPIHandler,
//     listPermissionsAPIHandler,
//     updatePermissionAPIHandler
// };
