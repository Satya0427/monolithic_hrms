import express, { Router } from 'express';
import { accessTokenValidatorMiddleware } from '../../../common/middleware/error.middleware';
import { validateRequest } from '../../../common/utils/validation_middleware';
import {
    assignSalarySchema,
    getEmployeeSalarySchema,
    reviseSalarySchema,
    getSalaryHistorySchema,
    getAllAssignmentsSchema,
    getAssignmentByIdSchema,
    deactivateSalarySchema
} from './employee_assignment.validation';
import {
    assignSalaryAPIHandler,
    getEmployeeSalaryAPIHandler,
    reviseSalaryAPIHandler,
    getSalaryHistoryAPIHandler,
    getAllAssignmentsAPIHandler,
    getAssignmentByIdAPIHandler,
    deactivateSalaryAPIHandler
} from './employee_assignment.controller';

const EMPLOYEE_ASSIGNMENT_ROUTER: Router = express.Router();

// ========================================
// 🔹 EMPLOYEE SALARY ASSIGNMENT ROUTES
// ========================================

//  Assign Salary to Employee
EMPLOYEE_ASSIGNMENT_ROUTER.post(
    '/assign',
    accessTokenValidatorMiddleware,
    validateRequest(assignSalarySchema, 'body'),
    assignSalaryAPIHandler
);

//  Get Employee Current Salary
EMPLOYEE_ASSIGNMENT_ROUTER.post(
    '/get-salary',
    accessTokenValidatorMiddleware,
    validateRequest(getEmployeeSalarySchema, 'body'),
    getEmployeeSalaryAPIHandler
);

//  Revise Salary (Create new version)
EMPLOYEE_ASSIGNMENT_ROUTER.post(
    '/revise',
    accessTokenValidatorMiddleware,
    validateRequest(reviseSalarySchema, 'body'),
    reviseSalaryAPIHandler
);

//  Get Salary History
EMPLOYEE_ASSIGNMENT_ROUTER.post(
    '/history',
    accessTokenValidatorMiddleware,
    validateRequest(getSalaryHistorySchema, 'body'),
    getSalaryHistoryAPIHandler
);

// Get All Assignments
EMPLOYEE_ASSIGNMENT_ROUTER.post(
    '/get_list',
    accessTokenValidatorMiddleware,
    validateRequest(getAllAssignmentsSchema, 'body'),
    getAllAssignmentsAPIHandler
);

//  Get Assignment by ID
EMPLOYEE_ASSIGNMENT_ROUTER.post(
    '/get_by_employee_id',
    accessTokenValidatorMiddleware,
    validateRequest(getAssignmentByIdSchema, 'body'),
    getAssignmentByIdAPIHandler
);

// Deactivate Salary Assignment
EMPLOYEE_ASSIGNMENT_ROUTER.post(
    '/deactivate',
    accessTokenValidatorMiddleware,
    validateRequest(deactivateSalarySchema, 'body'),
    deactivateSalaryAPIHandler
);

export default EMPLOYEE_ASSIGNMENT_ROUTER;
