import express, { Router } from 'express';

import {
    createLeaveTypeAPIHandler,
    listLeaveTypesAPIHandler,
    updateLeaveTypeStatusAPIHandler,
    createLeavePolicyAPIHandler,
    getLeavePolicyByIdAPIHandler,
    listLeavePoliciesAPIHandler,
    deleteLeavePolicyAPIHandler,
    createHolidayAPIHandler,
    listHolidaysAPIHandler,
    deleteHolidayAPIHandler,
    createWeeklyOffAPIHandler,
    getLeaveBalanceAPIHandler,
    applyLeaveAPIHandler,
    checkLeaveOverlapAPIHandler,
    updateLeaveRequestStatusAPIHandler,
    listLeaveRequestsAPIHandler
} from './leave_config.controller';

import { accessTokenValidatorMiddleware } from '../../../common/middleware/error.middleware';
import { validateRequest } from '../../../common/utils/validation_middleware';
import {
    createLeaveTypeSchema,
    listLeaveTypesSchema,
    updateLeaveTypeStatusSchema,
    createLeavePolicySchema,
    getLeavePolicyByIdSchema,
    listLeavePoliciesSchema,
    deleteLeavePolicySchema,
    createHolidaySchema,
    listHolidaySchema,
    deleteHolidaySchema,
    createWeeklyOffSchema,
    getLeaveBalanceSchema,
    applyLeaveSchema,
    checkLeaveOverlapSchema,
    approveLeaveRequestSchema,
    updateLeaveRequestStatusSchema,
    listLeaveRequestsSchema
} from './leave_config.validator';

// Root path /leave-config
const LEAVE_CONFIG_ROUTER: Router = express.Router();

// ==== Create Leave Type Routes ====
LEAVE_CONFIG_ROUTER.post(
    '/leave_type/create',
    accessTokenValidatorMiddleware,
    validateRequest(createLeaveTypeSchema, 'body'),
    createLeaveTypeAPIHandler
);

// ==== List Leave Types Routes ====
LEAVE_CONFIG_ROUTER.post(
    '/leave_type/get_list',
    accessTokenValidatorMiddleware,
    validateRequest(listLeaveTypesSchema, 'body'),
    listLeaveTypesAPIHandler
);

// ==== Update Leave Type Status Routes ====
LEAVE_CONFIG_ROUTER.post(
    '/leave_type/change_status',
    accessTokenValidatorMiddleware,
    validateRequest(updateLeaveTypeStatusSchema, 'body'),
    updateLeaveTypeStatusAPIHandler
);

// ==== Leave Policy Routes ====
LEAVE_CONFIG_ROUTER.post(
    '/leave_policy/create',
    accessTokenValidatorMiddleware,
    validateRequest(createLeavePolicySchema, 'body'),
    createLeavePolicyAPIHandler
);

// ==== Get Leave Policy By Id Routes ====
LEAVE_CONFIG_ROUTER.post(
    '/leave_policy/get_by_id',
    accessTokenValidatorMiddleware,
    validateRequest(getLeavePolicyByIdSchema, 'body'),
    getLeavePolicyByIdAPIHandler
);

// ==== List Leave Policies Routes ====
LEAVE_CONFIG_ROUTER.post(
    '/leave_policy/get_list',
    accessTokenValidatorMiddleware,
    validateRequest(listLeavePoliciesSchema, 'body'),
    listLeavePoliciesAPIHandler
);

// ==== Delete Leave Policy Routes ====
LEAVE_CONFIG_ROUTER.post(
    '/leave_policy/delete',
    accessTokenValidatorMiddleware,
    validateRequest(deleteLeavePolicySchema, 'body'),
    deleteLeavePolicyAPIHandler
);

// ==== Leave Calendar Routes ====
LEAVE_CONFIG_ROUTER.post(
    '/leave_calendar/holiday/create',
    accessTokenValidatorMiddleware,
    validateRequest(createHolidaySchema, 'body'),
    createHolidayAPIHandler
);

// ==== List Holidays Routes ====
LEAVE_CONFIG_ROUTER.post(
    '/leave_calendar/holiday/get_list',
    accessTokenValidatorMiddleware,
    validateRequest(listHolidaySchema, 'body'),
    listHolidaysAPIHandler
);

// ==== Delete Holiday Routes ====
LEAVE_CONFIG_ROUTER.post(
    '/leave_calendar/holiday/delete',
    accessTokenValidatorMiddleware,
    validateRequest(deleteHolidaySchema, 'body'),
    deleteHolidayAPIHandler
);

// ==== Create Weekly Off Routes ====
LEAVE_CONFIG_ROUTER.post(
    '/leave_calendar/weekly_off/create',
    accessTokenValidatorMiddleware,
    validateRequest(createWeeklyOffSchema, 'body'),
    createWeeklyOffAPIHandler
);

// ==== Leave Balance Routes ====
LEAVE_CONFIG_ROUTER.post(
    '/leave_balance/get_by_employee',
    accessTokenValidatorMiddleware,
    validateRequest(getLeaveBalanceSchema, 'body'),
    getLeaveBalanceAPIHandler
);

// ==== Leave Request Routes ====
LEAVE_CONFIG_ROUTER.post(
    '/leave_requests/apply',
    accessTokenValidatorMiddleware,
    validateRequest(applyLeaveSchema, 'body'),
    applyLeaveAPIHandler
);

LEAVE_CONFIG_ROUTER.post(
    '/leave_requests/check_overlap',
    accessTokenValidatorMiddleware,
    validateRequest(checkLeaveOverlapSchema, 'body'),
    checkLeaveOverlapAPIHandler
);

LEAVE_CONFIG_ROUTER.post(
    '/leave_requests/update_status',
    accessTokenValidatorMiddleware,
    validateRequest(updateLeaveRequestStatusSchema, 'body'),
    updateLeaveRequestStatusAPIHandler
);

LEAVE_CONFIG_ROUTER.post(
    '/leave_requests/get_list',
    accessTokenValidatorMiddleware,
    validateRequest(listLeaveRequestsSchema, 'body'),
    listLeaveRequestsAPIHandler
);

export default LEAVE_CONFIG_ROUTER;
