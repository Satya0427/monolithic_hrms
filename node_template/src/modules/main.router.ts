import express, { Router } from 'express';

// Modules Importing
import auth_router from './Auth/auth.router';
import organization_router from './organization/organization.router';
import subscription_router from './subscription/subscription_plan.router';
import org_admin_router from './global-admin/org_admin.router';
import MODULE_FEATURES_ROUTER from './module_features/module_features.router';
import { ONBOARDING_ROUTER } from './onboarding-exit/onboarding.routes';
import COMMON_ROUTER from '../common/controllers/common.router';
import LEAVE_CONFIG_ROUTER from './attendance_leave/leave/leave_config.router';
import ATTENDANCE_ROUTER from './attendance_leave/attendance/attendance.router';
import PAYROLL_STRUCTURE_ROUTER from './payroll_module/payroll_structure/payroll_structure.router';
import EMPLOYEE_ASSIGNMENT_ROUTER from './payroll_module/employee_assignment/employee_assignment.router';
import RUN_PAYROLL_ROUTER from './payroll_module/run-payroll/run-payroll.routes';
const main_router: Router = express.Router();

main_router.use('/auth', auth_router);
main_router.use('/organization', organization_router);
main_router.use('/subscription', subscription_router);
main_router.use('/org-admin', org_admin_router);
main_router.use('/common', COMMON_ROUTER);
main_router.use('/module-feature', MODULE_FEATURES_ROUTER);
main_router.use('/onboarding', ONBOARDING_ROUTER);
main_router.use('/leave-config', LEAVE_CONFIG_ROUTER);
main_router.use('/attendance', ATTENDANCE_ROUTER);
main_router.use('/payroll', PAYROLL_STRUCTURE_ROUTER);
main_router.use('/payroll/employee-assignment', EMPLOYEE_ASSIGNMENT_ROUTER);
main_router.use('/run-payroll', RUN_PAYROLL_ROUTER);

export default main_router;

