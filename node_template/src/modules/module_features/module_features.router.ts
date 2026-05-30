import express, { Router } from 'express';
import {
    createModuleFeaturesAPIHandler,
    // getModuleFeaturesAPIHandler,
    listModuleFeaturesAPIHandler,
    getRoleBasedModulesAPIHandler
    // updateModuleFeaturesAPIHandler,
    // deleteModuleFeaturesAPIHandler
} from './module_features.controller';
import { accessTokenValidatorMiddleware } from '../../common/middleware/error.middleware';
import { validateRequest } from '../../common/utils/validation_middleware';
import {
    createModuleFeaturesSchema,
    getModuleFeaturesSchema,
    listModuleFeaturesSchema,
    updateModuleFeaturesSchema,

} from './module_features.validatior';

const MODULE_FEATURES_ROUTER: Router = express.Router();

// Create module features
MODULE_FEATURES_ROUTER.post(
    '/create',
    accessTokenValidatorMiddleware,
    validateRequest(createModuleFeaturesSchema, 'body'),
    createModuleFeaturesAPIHandler
);

// Get module features by ID
MODULE_FEATURES_ROUTER.get(
    '/get_modules_by_id',
    accessTokenValidatorMiddleware,
    validateRequest(getModuleFeaturesSchema, 'params'),
    // getModuleFeaturesAPIHandler
);

// List module features (pagination, filters)
MODULE_FEATURES_ROUTER.post(
    '/get_modules_list_by_role',
    accessTokenValidatorMiddleware,
    // validateRequest(getModuleFeaturesByRoleSchema, 'params'),
    getRoleBasedModulesAPIHandler
);

// List module features (pagination, filters)
MODULE_FEATURES_ROUTER.get(
    '/get_modules_list',
    accessTokenValidatorMiddleware,
    listModuleFeaturesAPIHandler
);

// Update module features
// MODULE_FEATURES_ROUTER.put(
//     '/:moduleId',
//     accessTokenValidatorMiddleware,
//     validateRequest(updateModuleFeaturesSchema, 'all'),
//     updateModuleFeaturesAPIHandler
// );

// Delete module features (soft delete)
// MODULE_FEATURES_ROUTER.delete(
//     '/:moduleId',
//     accessTokenValidatorMiddleware,
//     validateRequest(getModuleFeaturesSchema, 'params'),
//     deleteModuleFeaturesAPIHandler
// );

export default MODULE_FEATURES_ROUTER;
