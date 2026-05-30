import express, { Router } from 'express';
import { accessTokenValidatorMiddleware } from '../../../common/middleware/error.middleware';
import { validateRequest } from '../../../common/utils/validation_middleware';
import {
    validatePayrollMonthSchema,
    processPayrollSchema,
    recalculatePayrollSchema,
    markPayrollProcessedSchema,
    lockPayrollSchema,
    getPayrollRunsSchema,
    getPayrollRunByIdSchema,
    getPayrollRunEmployeesSchema
} from './run-payroll.validation';
import {
    validatePayrollMonthAPIHandler,
    processPayrollAPIHandler,
    recalculatePayrollAPIHandler,
    markPayrollProcessedAPIHandler,
    lockPayrollAPIHandler,
    getPayrollRunsAPIHandler,
    getPayrollRunByIdAPIHandler,
    getPayrollRunEmployeesAPIHandler
} from './run-payroll.controller';

const RUN_PAYROLL_ROUTER: Router = express.Router();

// ==== PROCESS PAYROLL =====   
RUN_PAYROLL_ROUTER.post(
    '/process',
    accessTokenValidatorMiddleware,
    validateRequest(processPayrollSchema, 'body'),
    processPayrollAPIHandler
);


// ==== GET PAYROLL RUN BY ID =====
RUN_PAYROLL_ROUTER.post(
    '/get-by-id',
    accessTokenValidatorMiddleware,
    validateRequest(getPayrollRunByIdSchema, 'body'),
    getPayrollRunByIdAPIHandler
);


// ==== GET PAYROLL RUNS =====
RUN_PAYROLL_ROUTER.post(
    '/get-list',
    accessTokenValidatorMiddleware,
    validateRequest(getPayrollRunsSchema, 'body'),
    getPayrollRunsAPIHandler
);


// ===== VALIDATE PAYROLL MONTH =====
RUN_PAYROLL_ROUTER.post(
    '/validate-month',
    accessTokenValidatorMiddleware,
    validateRequest(validatePayrollMonthSchema, 'body'),
    validatePayrollMonthAPIHandler
);


// ==== RE-CALCULATE PAYROLL =====
RUN_PAYROLL_ROUTER.post(
    '/recalculate',
    accessTokenValidatorMiddleware,
    validateRequest(recalculatePayrollSchema, 'body'),
    recalculatePayrollAPIHandler
);

// ==== MARK PAYROLL AS PROCESSED =====
RUN_PAYROLL_ROUTER.post(
    '/mark-processed',
    accessTokenValidatorMiddleware,
    validateRequest(markPayrollProcessedSchema, 'body'),
    markPayrollProcessedAPIHandler
);

// ==== LOCK PAYROLL =====
RUN_PAYROLL_ROUTER.post(
    '/lock',
    accessTokenValidatorMiddleware,
    validateRequest(lockPayrollSchema, 'body'),
    lockPayrollAPIHandler
);




// ==== GET PAYROLL RUN EMPLOYEES =====
RUN_PAYROLL_ROUTER.post(
    '/get-employees',
    accessTokenValidatorMiddleware,
    validateRequest(getPayrollRunEmployeesSchema, 'body'),
    getPayrollRunEmployeesAPIHandler
);

export default RUN_PAYROLL_ROUTER;
