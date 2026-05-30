import express, { Router } from 'express';
import { accessTokenValidatorMiddleware } from '../../../common/middleware/error.middleware';
import { validateRequest } from '../../../common/utils/validation_middleware';
import {
    createComponentSchema,
    getComponentsQuerySchema,
    getComponentByIdSchema,
    updateComponentSchema,
    toggleStatusSchema,
    deleteComponentSchema,
    createTemplateSchema,
    getAllTemplatesSchema,
    getTemplateByIdSchema,
    updateTemplateSchema,
    duplicateTemplateSchema,
    toggleTemplateStatusSchema,
    deleteTemplateSchema,
    getTemplatesForAssignmentSchema
} from './payroll_structure.validation';
import {
    createComponentAPIHandler,
    getAllComponentsAPIHandler,
    getComponentByIdAPIHandler,
    updateComponentAPIHandler,
    toggleStatusAPIHandler,
    deleteComponentAPIHandler,
    createTemplateAPIHandler,
    getAllTemplatesAPIHandler,
    getTemplateByIdAPIHandler,
    updateTemplateAPIHandler,
    duplicateTemplateAPIHandler,
    toggleTemplateStatusAPIHandler,
    deleteTemplateAPIHandler,
    getTemplatesForAssignmentAPIHandler
} from './payroll_structure.controller';

const PAYROLL_STRUCTURE_ROUTER: Router = express.Router();
//#endregion

//  Create Component
PAYROLL_STRUCTURE_ROUTER.post(
    '/component/create',
    accessTokenValidatorMiddleware,
    validateRequest(createComponentSchema, 'body'),
    createComponentAPIHandler
);

//  Get All Components with filters
PAYROLL_STRUCTURE_ROUTER.post(
    '/component/get_all',
    accessTokenValidatorMiddleware,
    validateRequest(getComponentsQuerySchema, 'body'),
    getAllComponentsAPIHandler
);

//  Get Single Component
PAYROLL_STRUCTURE_ROUTER.post(
    '/component/get_by_id',
    accessTokenValidatorMiddleware,
    validateRequest(getComponentByIdSchema, 'body'),
    getComponentByIdAPIHandler
);

//  Update Component
PAYROLL_STRUCTURE_ROUTER.post(
    '/component/update',
    accessTokenValidatorMiddleware,
    validateRequest(updateComponentSchema, 'body'),
    updateComponentAPIHandler
);

//  Toggle Status`
PAYROLL_STRUCTURE_ROUTER.post(
    '/component/toggle-status-change',
    accessTokenValidatorMiddleware,
    validateRequest(toggleStatusSchema, 'body'),
    toggleStatusAPIHandler
);

//  Soft Delete
PAYROLL_STRUCTURE_ROUTER.post(
    '/component/delete',
    accessTokenValidatorMiddleware,
    validateRequest(deleteComponentSchema, 'body'),
    deleteComponentAPIHandler
);
//#region PAYROLL COMPONENTS ROUTES



// ========================================
// 🔹 PAYROLL TEMPLATES ROUTES
// ========================================

//  Create Template
PAYROLL_STRUCTURE_ROUTER.post(
    '/template/create',
    accessTokenValidatorMiddleware,
    validateRequest(createTemplateSchema, 'body'),
    createTemplateAPIHandler
);

// Get All Templates with filters
PAYROLL_STRUCTURE_ROUTER.post(
    '/template/get_list',
    accessTokenValidatorMiddleware,
    validateRequest(getAllTemplatesSchema, 'body'),
    getAllTemplatesAPIHandler
);

// Get Single Template
PAYROLL_STRUCTURE_ROUTER.post(
    '/template/get_by_id',
    accessTokenValidatorMiddleware,
    validateRequest(getTemplateByIdSchema, 'body'),
    getTemplateByIdAPIHandler
);

// Update Template
PAYROLL_STRUCTURE_ROUTER.post(
    '/template/update',
    accessTokenValidatorMiddleware,
    validateRequest(updateTemplateSchema, 'body'),
    updateTemplateAPIHandler
);

// Duplicate Template
PAYROLL_STRUCTURE_ROUTER.post(
    '/template/duplicate',
    accessTokenValidatorMiddleware,
    validateRequest(duplicateTemplateSchema, 'body'),
    duplicateTemplateAPIHandler
);

// Toggle Status
PAYROLL_STRUCTURE_ROUTER.post(
    '/template/toggle_status_change',
    accessTokenValidatorMiddleware,
    validateRequest(toggleTemplateStatusSchema, 'body'),
    toggleTemplateStatusAPIHandler
);

// Soft Delete
PAYROLL_STRUCTURE_ROUTER.post(
    '/template/delete',
    accessTokenValidatorMiddleware,
    validateRequest(deleteTemplateSchema, 'body'),
    deleteTemplateAPIHandler
);

//  Get Templates for Assignment Dropdown
PAYROLL_STRUCTURE_ROUTER.post(
    '/template/for_assignment',
    accessTokenValidatorMiddleware,
    validateRequest(getTemplatesForAssignmentSchema, 'body'),
    getTemplatesForAssignmentAPIHandler
);


export default PAYROLL_STRUCTURE_ROUTER;
