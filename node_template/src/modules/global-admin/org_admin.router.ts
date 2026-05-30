import express, { Router } from 'express';
import {
    createorgAdminAPIHandler,
    getorgAdminDetailsByIdHandler,
    getOrgAdminListAPIHandler,
    getorgAdminViewDetailsAPIHandler,
    updateorgAdminAPIHandler,
    newCreateorgAdminAPIHandler
} from "./org_admin.controller";
import { accessTokenValidatorMiddleware } from '../../common/middleware/error.middleware';
import { validateRequest } from '../../common/utils/validation_middleware';
import {
    createorgAdminSchema,
    getorgAdminByIdSchema,
    listorgAdminsSchema,
    updateorgAdminSchema
} from './org_admin.validator';

const org_admin_router: Router = express.Router();

// Create org Admin API
org_admin_router.post(
    '/create',
    accessTokenValidatorMiddleware,
    validateRequest(createorgAdminSchema, 'body'),
    newCreateorgAdminAPIHandler
)

// Get org Admin Details By ID
org_admin_router.post(
    '/get_details',
    accessTokenValidatorMiddleware,
    validateRequest(getorgAdminByIdSchema, 'body'),
    getorgAdminDetailsByIdHandler
)

// Get org Admin List
org_admin_router.post(
    '/get_admins',
    accessTokenValidatorMiddleware,
    validateRequest(listorgAdminsSchema, 'query'),
    getOrgAdminListAPIHandler
)

// org Admin View Own Details
org_admin_router.get(
    '/get_view_details',
    accessTokenValidatorMiddleware,
    getorgAdminViewDetailsAPIHandler
)

// Update org Admin (Optional)
org_admin_router.put(
    '/:adminId',
    accessTokenValidatorMiddleware,
    validateRequest(updateorgAdminSchema, 'all'),
    updateorgAdminAPIHandler
)

export default org_admin_router;