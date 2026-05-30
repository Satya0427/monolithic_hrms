import express, { Router } from 'express';
import { accessTokenValidatorMiddleware } from '../../../common/middleware/error.middleware';
import { validateRequest } from '../../../common/utils/validation_middleware';
import {
    checkInSchema,
    checkOutSchema,
    calculateAttendanceSchema,
    getDayHistoryQuerySchema,
    getMonthSummaryQuerySchema,
    riseWFHRequestSchema,
    getWFHRequestsQuerySchema,
    updateWFHRequestStatusSchema,
    wfhCheckInSchema,
    wfhCheckOutSchema,
    createAttendanceRegularizationSchema,
    getMyAttendanceRegularizationsSchema,
    getApproverAttendanceRegularizationsSchema,
    updateAttendanceRegularizationStatusSchema,
    applyAttendanceRegularizationSchema
} from './attendance.validator';
import {
    checkInAPIHandler,
    checkOutAPIHandler,
    wfhCheckInAPIHandler,
    wfhCheckOutAPIHandler,
    calculateAttendanceAPIHandler,
    getDayHistoryAPIHandler,
    getClockLogsAPIHandler,
    riseWFHRequestAPIHandler,
    getWFHRequestListAPIHandler,
    updateWFHRequestStatusChangeAPIHandler,
    createAttendanceRegularizationAPIHandler,
    getMyAttendanceRegularizationsAPIHandler,
    getApproverAttendanceRegularizationsAPIHandler,
    updateAttendanceRegularizationStatusAPIHandler,
    applyAttendanceRegularizationAPIHandler
} from './attendance.controller';
import { getMonthSummaryAPIHandler } from './attendance.controller';

const ATTENDANCE_ROUTER: Router = express.Router();

ATTENDANCE_ROUTER.post(
    '/check_in',
    accessTokenValidatorMiddleware,
    validateRequest(checkInSchema, 'body'),
    checkInAPIHandler
);

ATTENDANCE_ROUTER.post(
    '/check_out',
    accessTokenValidatorMiddleware,
    validateRequest(checkOutSchema, 'body'),
    checkOutAPIHandler
);

ATTENDANCE_ROUTER.post(
    '/wfh/check_in',
    accessTokenValidatorMiddleware,
    validateRequest(wfhCheckInSchema, 'body'),
    wfhCheckInAPIHandler
);

ATTENDANCE_ROUTER.post(
    '/wfh/check_out',
    accessTokenValidatorMiddleware,
    validateRequest(wfhCheckOutSchema, 'body'),
    wfhCheckOutAPIHandler
);

ATTENDANCE_ROUTER.post(
    '/monthly-summary',
    accessTokenValidatorMiddleware,
    getMonthSummaryAPIHandler
);
ATTENDANCE_ROUTER.get(
    '/calculate',
    accessTokenValidatorMiddleware,
    // validateRequest(calculateAttendanceSchema, 'body'),
    calculateAttendanceAPIHandler
);

ATTENDANCE_ROUTER.post(
    '/history',
    accessTokenValidatorMiddleware,
    // validateRequest(getDayHistoryQuerySchema, 'query'),
    getDayHistoryAPIHandler
);

ATTENDANCE_ROUTER.post(
    '/clock_logs',
    accessTokenValidatorMiddleware,
    // validateRequest(getMonthSummaryQuerySchema, 'query'),
    getClockLogsAPIHandler
);

ATTENDANCE_ROUTER.post(
    '/wfh/rise-request',
    accessTokenValidatorMiddleware,
    validateRequest(riseWFHRequestSchema, 'body'),
    riseWFHRequestAPIHandler
);

ATTENDANCE_ROUTER.post(
    '/wfh/requests-list',
    accessTokenValidatorMiddleware,
    validateRequest(getWFHRequestsQuerySchema, 'body'),
    getWFHRequestListAPIHandler
);

ATTENDANCE_ROUTER.post(
    '/wfh/status-update',
    accessTokenValidatorMiddleware,
    validateRequest(updateWFHRequestStatusSchema, 'body'),
    updateWFHRequestStatusChangeAPIHandler
);

ATTENDANCE_ROUTER.post(
    '/regularization-requests',
    accessTokenValidatorMiddleware,
    validateRequest(createAttendanceRegularizationSchema, 'body'),
    createAttendanceRegularizationAPIHandler
);

ATTENDANCE_ROUTER.post(
    '/regularization-requests/my',
    accessTokenValidatorMiddleware,
    validateRequest(getMyAttendanceRegularizationsSchema, 'body'),
    getMyAttendanceRegularizationsAPIHandler
);

ATTENDANCE_ROUTER.post(
    '/regularization-requests/pending',
    accessTokenValidatorMiddleware,
    validateRequest(getApproverAttendanceRegularizationsSchema, 'body'),
    getApproverAttendanceRegularizationsAPIHandler
);

ATTENDANCE_ROUTER.post(
    '/regularization-requests/status-update',
    accessTokenValidatorMiddleware,
    validateRequest(updateAttendanceRegularizationStatusSchema, 'body'),
    updateAttendanceRegularizationStatusAPIHandler
);

ATTENDANCE_ROUTER.post(
    '/regularization-requests/apply',
    accessTokenValidatorMiddleware,
    validateRequest(applyAttendanceRegularizationSchema, 'body'),
    applyAttendanceRegularizationAPIHandler
);

export default ATTENDANCE_ROUTER;

