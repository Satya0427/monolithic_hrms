import express, { Router } from 'express';
import { accessTokenValidatorMiddleware } from '../middleware/error.middleware';
import { bulkLookupsDropdownSchema, leaveTypesDropdownSchema, lookupsDropdownSchema, organizationsDropdownSchema, rolesDropdownSchema } from './dropdowns/dropdown.validator';
import { validateRequest } from '../utils/validation_middleware';
import { getLookupsByCategory } from '../utils/common';
import { getBulkLookups } from './lookups/lookup.controller';
import { getEmployeesByManagerBodySchema } from './utilities/utilities.validatior';
import {
    getDepartmentsByOrganizationAPIHandler,
    getDesignationsByDepartmentAPIHandler,
    getEmployeeByOrganizationAPIHandler,
    getEmployeeProfileImage,
    getOrganizationsDropdownAPIHandler,
    getLeaveTypesDropdownAPIHandler,
    getRolesDropdownAPIHandler,
    getShiftsDropdownAPIHandler,
} from './dropdowns/dropdown.controller';
import { getEmployeesByManagerIdAPIHandler } from './utilities/utilities.controller';

const COMMON_ROUTER: Router = express.Router();
// Organizations Dropdown (Without pagination)
COMMON_ROUTER.post(
    '/organizations-dropdown',
    accessTokenValidatorMiddleware,
    validateRequest(organizationsDropdownSchema, 'body'),
    getOrganizationsDropdownAPIHandler
);

COMMON_ROUTER.post(
    '/designations-dropdown',
    accessTokenValidatorMiddleware,
    validateRequest(organizationsDropdownSchema, 'body'),
    getDesignationsByDepartmentAPIHandler
);

COMMON_ROUTER.get(
    '/departments-dropdown',
    accessTokenValidatorMiddleware,
    getDepartmentsByOrganizationAPIHandler
);

// Organizations Dropdown (Without pagination)
COMMON_ROUTER.get(
  '/get_image/:id',
  getEmployeeProfileImage
);

COMMON_ROUTER.get(
    '/employee-dropdown',
    accessTokenValidatorMiddleware,
    getEmployeeByOrganizationAPIHandler
);

COMMON_ROUTER.post(
    '/employees-by-manager',
    accessTokenValidatorMiddleware,
    validateRequest(getEmployeesByManagerBodySchema, 'body'),
    getEmployeesByManagerIdAPIHandler
);

// Leave Types Dropdown (Without pagination)
COMMON_ROUTER.get(
    '/leave-types-dropdown',
    accessTokenValidatorMiddleware,
    getLeaveTypesDropdownAPIHandler
);

// Roles Dropdown (Without pagination)
COMMON_ROUTER.get(
    '/roles-dropdown',
    accessTokenValidatorMiddleware,
    getRolesDropdownAPIHandler
);

// Shifts Dropdown (Without pagination)
COMMON_ROUTER.get(
    '/shifts-dropdown',
    accessTokenValidatorMiddleware,
    getShiftsDropdownAPIHandler
);

// Organizations Dropdown (Without pagination)
COMMON_ROUTER.post(
    '/lookup',
    accessTokenValidatorMiddleware,
    validateRequest(lookupsDropdownSchema, 'body'),
    getLookupsByCategory
);

// Organizations Dropdown (Without pagination)
COMMON_ROUTER.post(
    '/bulk_lookup',
    accessTokenValidatorMiddleware,
    validateRequest(bulkLookupsDropdownSchema, 'body'),
    getBulkLookups
);



export default COMMON_ROUTER;
