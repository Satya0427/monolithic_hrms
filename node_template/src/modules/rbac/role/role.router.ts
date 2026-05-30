import express, { Router } from 'express';

import {
    createRoleAPIHandler,
    getRoleByIdAPIHandler,
    listRolesAPIHandler,
    updateRoleAPIHandler,
    updateRoleStatusAPIHandler
} from './role.controller';

import { accessTokenValidatorMiddleware } from '../../../common/middleware/error.middleware';

const role_router: Router = express.Router();

// Create role
role_router.post(
    "/create",
    accessTokenValidatorMiddleware,
    createRoleAPIHandler
);

// Get role by ID
role_router.get(
    "/:roleId",
    accessTokenValidatorMiddleware,
    getRoleByIdAPIHandler
);

// List roles
role_router.get(
    "/",
    accessTokenValidatorMiddleware,
    listRolesAPIHandler
);

// Update role
role_router.put(
    "/:roleId",
    accessTokenValidatorMiddleware,
    updateRoleAPIHandler
);

// Activate / Deactivate role
role_router.patch(
    "/:roleId/status",
    accessTokenValidatorMiddleware,
    updateRoleStatusAPIHandler
);

export default role_router;
