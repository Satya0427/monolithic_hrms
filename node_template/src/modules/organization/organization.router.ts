import express, { Router } from 'express';

import {
    createOrganizationOnboardingAPIHandler,
    getOrganizationByIdAPIHandler,
    getOrganizationDetailsAPIHandler,
    listOrganizationsAPIHandler,
    // updateOrganizationAPIHandler,
    updateOrganizationStatusAPIHandler
} from './organization.controller';

import { accessTokenValidatorMiddleware } from '../../common/middleware/error.middleware';
import { validateRequest } from '../../common/utils/validation_middleware';
import {
    createOrganizationOnboardingSchema,
    getOrganizationByIdSchema,
    listOrganizationsSchema,
    updateOrganizationStatusSchema
} from './organization.validator';

const ORGANIZATION_ROUTER: Router = express.Router();

// Create organization
ORGANIZATION_ROUTER.post(
    "/create",
    accessTokenValidatorMiddleware,
    validateRequest(createOrganizationOnboardingSchema, 'body'),
    createOrganizationOnboardingAPIHandler
);

// Get organization by ID
ORGANIZATION_ROUTER.post(
    "/org_dtls_by_id",
    accessTokenValidatorMiddleware,
    validateRequest(getOrganizationByIdSchema, 'body'),
    getOrganizationByIdAPIHandler
);

// List organizations (pagination, filters)
ORGANIZATION_ROUTER.post(
    "/orginization_list",
    accessTokenValidatorMiddleware,
    validateRequest(listOrganizationsSchema, 'body'),
    listOrganizationsAPIHandler
);

// List organizations (pagination, filters)
ORGANIZATION_ROUTER.post(
    "/orginization_view_details",
    accessTokenValidatorMiddleware,
    validateRequest(getOrganizationByIdSchema, 'body'),
    getOrganizationDetailsAPIHandler
);

// Update organization
// ORGANIZATION_ROUTER.put(
//     "/:organizationId",
//     accessTokenValidatorMiddleware,
//     validateRequest(updateOrganizationSchema, 'all'),
//     updateOrganizationAPIHandler
// );

// Activate / Suspend organization
ORGANIZATION_ROUTER.patch(
    "/:organizationId/status",
    accessTokenValidatorMiddleware,
    validateRequest(updateOrganizationStatusSchema, 'all'),
    updateOrganizationStatusAPIHandler
);

export default ORGANIZATION_ROUTER;
