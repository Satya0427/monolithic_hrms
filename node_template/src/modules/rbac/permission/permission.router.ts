// import express, { Router } from 'express';

// import {
//     createPermissionAPIHandler,
//     getPermissionByIdAPIHandler,
//     listPermissionsAPIHandler,
//     updatePermissionAPIHandler
// } from './permission.controller';

// import { accessTokenValidatorMiddleware } from '../../../common/middleware/error.middleware';

// const permission_router: Router = express.Router();

// // Create permission
// permission_router.post(
//     "/create",
//     accessTokenValidatorMiddleware,
//     createPermissionAPIHandler
// );

// // Get permission by ID
// permission_router.get(
//     "/:permissionId",
//     accessTokenValidatorMiddleware,
//     getPermissionByIdAPIHandler
// );

// // List permissions
// permission_router.get(
//     "/",
//     accessTokenValidatorMiddleware,
//     listPermissionsAPIHandler
// );

// // Update permission
// permission_router.put(
//     "/:permissionId",
//     accessTokenValidatorMiddleware,
//     updatePermissionAPIHandler
// );

// export default permission_router;
