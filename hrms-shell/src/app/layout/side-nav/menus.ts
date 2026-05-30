import { routes } from "../../app.routes";

export const MODULE_FEATURES = [
    /* ================= DASHBOARD ================= */
    {
        label: 'Dashboard',
        icon: 'dashboard',
        key: 'DASHBOARD',
        active: false,
        expanded: false,
        subItems: [
            { label: 'Organization Dashboard', route: '/home/dashboard/org', key: 'ORG_DASHBOARD', active: false },
            { label: 'HR Dashboard', route: '/home/dashboard/hr', key: 'HR_DASHBOARD', active: false },
            { label: 'Manager Dashboard', route: '/home/dashboard/manager', key: 'MANAGER_DASHBOARD', active: false }
        ]
    },

    /* ================= EMPLOYEE ================= */
    {
        label: 'Employee',
        icon: 'badge',
        key: 'EMPLOYEE',
        active: false,
        expanded: false,
        subItems: [
            { label: 'Employee Directory', route: '/home/employee-module/list', key: 'EMPLOYEE_LIST', active: false },
            { label: 'Employee Profile', route: '/home/employee-module/profile', key: 'EMPLOYEE_PROFILE', active: false },
            { label: 'Employee Onboarding', route: '/home/employee-module/employee-onboarding', key: 'EMPLOYEE_ONBOARDING', active: false },
            { label: 'Employee Offboarding', route: '/home/employee-module/offboarding', key: 'EMPLOYEE_OFFBOARDING', active: false }
        ]
    },

    /* ================= RECRUITMENT ================= */
    {
        label: 'Recruitment',
        icon: 'work_outline',
        key: 'RECRUITMENT',
        active: false,
        expanded: false,
        subItems: [
            { label: 'Job Requisitions', route: '/home/recruitment/requisitions', key: 'JOB_REQUISITIONS', active: false },
            { label: 'Job Openings', route: '/home/recruitment/jobs', key: 'JOB_OPENINGS', active: false },
            { label: 'Candidates', route: '/home/recruitment/candidates', key: 'CANDIDATES', active: false },
            { label: 'Interviews', route: '/home/recruitment/interviews', key: 'INTERVIEWS', active: false },
            { label: 'Offers', route: '/home/recruitment/offers', key: 'OFFERS', active: false },
            { label: 'Recruitment Admin', route: '/home/recruitment/admin', key: 'RECRUITMENT_ADMIN', active: false }
        ]
    },

    /* ================= LEAVE & ATTENDANCE ================= */
    {
        label: 'Leave & Attendance',
        icon: 'event_note',
        key: 'LEAVE_ATTENDANCE',
        active: false,
        expanded: false,
        subItems: [
            { label: 'Overview', route: '/home/leave-attendance/overview', key: 'LEAVE_ATTENDANCE_OVERVIEW', active: false },
            {
                label: 'Leave',
                key: 'LEAVE',
                icon: 'beach_access',
                active: false,
                expanded: false,
                subFeatures: [
                    { label: 'Leave Admin', route: '/home/leave-management-module', key: 'LEAVE_ADMIN', active: false },
                    { label: 'Leave Balance', route: '/home/leave-management-module/leave-balance', key: 'LEAVE_BALANCE', active: false },
                    // { label: 'My Leave', route: '/home/leave-management-module/my-leaves', key: 'MY_LEAVE', active: false },
                    { label: 'Team Leave', route: '/home/leave-management-module/employee-list', key: 'TEAM_LEAVE', active: false },
                    // { label: 'Leave Requests', route: '/home/leave-management-module/leave-requests', key: 'LEAVE_REQUESTS', active: false },
                ]
            },
            {
                label: 'Attendance',
                key: 'ATTENDANCE',
                icon: 'event_available',
                active: false,
                expanded: false,
                subFeatures: [
                    { label: 'My Attendance', route: '/home/attendance-module/my-attendance', key: 'MY_ATTENDANCE', active: false },
                    { label: 'Team Attendance', route: '/home/attendance-module/team-attendance', key: 'TEAM_ATTENDANCE', active: false },
                    // { label: 'Regularization', route: '/home/attendance-module/regularization', key: 'REGULARIZATION', active: false },
                    // { label: 'Attendance Admin', route: '/home/attendance-module/admin', key: 'ATTENDANCE_ADMIN', active: false }
                ]
            },
            {
                label: 'Approvals',
                icon: 'task',
                key: 'APPROVALS',
                active: false,
                expanded: false,
                subFeatures: [
                    { label: 'Leave Requests', route: '/home/requests-module/leave-requests', key: 'LEAVE_REQUESTS', active: false },
                    { label: 'Attendance Regularization', route: '/home/requests-module/attendance-regularization', key: 'ATTENDANCE_REGULARIZATION', active: false },
                    { label: 'WFH Requests', route: '/home/requests-module/wfh-requests', key: 'WFH_REQUESTS', active: false },
                    { label: 'Approval History', route: '/home/requests-module/approval-history', key: 'APPROVAL_HISTORY', active: false }
                ]
            },
            { label: 'Reports', route: '/home/leave-attendance/reports', key: 'LEAVE_ATTENDANCE_REPORTS', active: false }
        ]
    },

    /* ================= PAYROLL ================= */
    {
        label: 'Payroll',
        icon: 'payments',
        key: 'PAYROLL',
        active: false,
        expanded: false,
        subItems: [

            // ================= DASHBOARD =================
            { label: 'Dashboard', route: '/home/payroll-module/dashboard', key: 'PAYROLL_DASHBOARD', active: false },

            // ================= RUN PAYROLL =================
            {
                label: 'Run Payroll',
                key: 'RUN_PAYROLL',
                icon: 'play_circle',
                active: false,
                expanded: false,
                subFeatures: [
                    { label: 'Process Payroll', route:  '/home/payroll-module/run-payroll/payroll-process', key: 'PROCESS_PAYROLL', active: false },
                    { label: 'Payroll History', route: '/home/payroll-module/run-payroll/payroll-history', key: 'PAYROLL_HISTORY', active: false },
                    { label: 'Locked Payroll', route: '/home/payroll-module/run-payroll/locked-payroll', key: 'LOCKED_PAYROLL', active: false }
                ]
            },

            // ================= PAYSLIPS =================
            {
                label: 'Payslips',
                key: 'PAYSLIPS',
                icon: 'receipt_long',
                active: false,
                expanded: false,
                subFeatures: [
                    { label: 'Employee Payslips', route: '/home/payroll/payslips', key: 'EMPLOYEE_PAYSLIPS', active: false },
                    { label: 'Bulk Download', route: '/home/payroll/payslips/bulk-download', key: 'BULK_PAYSLIP_DOWNLOAD', active: false },
                    { label: 'Payslip Settings', route: '/home/payroll/payslips/settings', key: 'PAYSLIP_SETTINGS', active: false }
                ]
            },

            // ================= SALARY STRUCTURE =================
            {
                label: 'Salary Structure',
                key: 'SALARY_STRUCTURE',
                icon: 'account_balance_wallet',
                active: false,
                expanded: false,
                subFeatures: [
                    { label: 'Components', route: '/home/payroll-module/payroll-structure/components', key: 'SALARY_COMPONENTS', active: false },
                    { label: 'Templates', route: '/home/payroll-module/payroll-structure/templates', key: 'SALARY_TEMPLATES', active: false },
                    { label: 'Employee Assignment', route: '/home/payroll-module/payroll-structure/employee-assignment', key: 'ASSIGN_SALARY_STRUCTURE', active: false }
                ]
            },

            // ================= REIMBURSEMENTS =================
            {
                label: 'Reimbursements',
                key: 'REIMBURSEMENTS',
                icon: 'request_quote',
                active: false,
                expanded: false,
                subFeatures: [
                    { label: 'Claims', route: '/home/payroll-module/reimbursements/claims', key: 'REIMBURSEMENT_CLAIMS', active: false },
                    { label: 'Reimbursement Types', route: '/home/payroll-module/reimbursements/types', key: 'REIMBURSEMENT_TYPES', active: false }
                ]
            },

            // ================= LOANS & ADVANCES =================
            {
                label: 'Loans & Advances',
                key: 'LOANS_ADVANCES',
                icon: 'credit_score',
                active: false,
                expanded: false,
                subFeatures: [
                    { label: 'Loan Requests', route: '/home/payroll/loans', key: 'LOAN_REQUESTS', active: false },
                    { label: 'EMI Schedule', route: '/home/payroll/loans/emi-schedule', key: 'EMI_SCHEDULE', active: false },
                ]
            },

            // ================= COMPLIANCE =================
            {
                label: 'Compliance',
                key: 'PAYROLL_COMPLIANCE',
                icon: 'gavel',
                active: false,
                expanded: false,
                subFeatures: [
                    { label: 'PF Reports', route: '/home/payroll/compliance/pf', key: 'PF_REPORTS', active: false },
                    { label: 'ESI Reports', route: '/home/payroll/compliance/esi', key: 'ESI_REPORTS', active: false },
                    { label: 'Professional Tax', route: '/home/payroll/compliance/pt', key: 'PT_REPORTS', active: false },
                    { label: 'TDS Reports', route: '/home/payroll/compliance/tds', key: 'TDS_REPORTS', active: false },
                ]
            },

            // ================= PAYROLL SETTINGS =================
            {
                label: 'Payroll Settings',
                key: 'PAYROLL_SETTINGS',
                icon: 'settings',
                active: false,
                expanded: false,
                subFeatures: [
                    { label: 'General Settings', route: '/home/payroll/settings/general', key: 'PAYROLL_GENERAL_SETTINGS', active: false },
                    { label: 'Statutory Settings', route: '/home/payroll/settings/statutory', key: 'PAYROLL_STATUTORY_SETTINGS', active: false },
                    { label: 'Pay Cycle', route: '/home/payroll/settings/pay-cycle', key: 'PAY_CYCLE_SETTINGS', active: false },
                    { label: 'Pay Cycle', route: '/home/payroll/settings/pay-cycle', key: 'PAY_CYCLE_SETTINGS', active: false }
                ]
            }
        ]
    },


    /* ================= PERFORMANCE ================= */
    {
        label: 'Performance',
        icon: 'trending_up',
        key: 'PERFORMANCE',
        active: false,
        expanded: false,
        subItems: [
            { label: 'Goals', route: '/home/performance/goals', key: 'GOALS', active: false },
            { label: 'Reviews', route: '/home/performance/reviews', key: 'REVIEWS', active: false },
            { label: 'Feedback', route: '/home/performance/feedback', key: 'FEEDBACK', active: false },
            { label: 'Performance Admin', route: '/home/performance/admin', key: 'PERFORMANCE_ADMIN', active: false }
        ]
    },

    /* ================= ASSETS ================= */
    {
        label: 'Assets',
        icon: 'inventory_2',
        key: 'ASSETS',
        active: false,
        expanded: false,
        subItems: [
            { label: 'Asset Inventory', route: '/home/assets/inventory', key: 'ASSET_INVENTORY', active: false },
            { label: 'Assign Assets', route: '/home/assets/assign', key: 'ASSIGN_ASSETS', active: false },
            { label: 'Asset Requests', route: '/home/assets/requests', key: 'ASSET_REQUESTS', active: false },
            { label: 'Assets Admin', route: '/home/assets/admin', key: 'ASSETS_ADMIN', active: false }
        ]
    },

    /* ================= REPORTS ================= */
    {
        label: 'Reports',
        icon: 'assessment',
        key: 'REPORTS',
        active: false,
        expanded: false,
        subItems: [
            { label: 'HR Reports', route: '/home/reports/hr', key: 'HR_REPORTS', active: false },
            { label: 'Payroll Reports', route: '/home/reports/payroll', key: 'PAYROLL_REPORTS', active: false },
            { label: 'Compliance Reports', route: '/home/reports/compliance', key: 'COMPLIANCE_REPORTS', active: false }
        ]
    },

    /* ================= PLATFORM MANAGEMENT ================= */
    {
        label: 'Platform Management',
        icon: 'space_dashboard',
        key: 'PLATFORM_MANAGEMENT',
        active: false,
        expanded: false,
        subItems: [
            { label: 'Platform Dashboard', route: '/home/platform-management/dashboard', key: 'PLATFORM_DASHBOARD', active: false },
            { label: 'Organizations', route: '/home/platform-management/orginization', key: 'ORGANIZATIONS', active: false },
            { label: 'Global Admin Users', route: '/home/platform-management/global-admin', key: 'GLOBAL_ADMIN_USERS', active: false },
            { label: 'Subscription & Plans', route: '/home/platform-management/subscription-plans', key: 'SUBSCRIPTION_PLANS', active: false },
            { label: 'Module & Feature Management', route: '/home/platform-management/module-feature-management', key: 'MODULE_FEATURE_MANAGEMENT', active: false },
            { label: 'Usage & Limits', route: '/home/platform-management/usage-limits', key: 'USAGE_LIMITS', active: false }
        ]
    },

    /* ================= SETTINGS ================= */
    {
        label: 'Settings',
        icon: 'settings',
        key: 'SETTINGS',
        active: false,
        expanded: false,
        subItems: [
            { label: 'Organization Settings', route: '/home/settings/org', key: 'ORG_SETTINGS', active: false },
            { label: 'Roles & Permissions', route: '/home/settings/roles', key: 'ROLES_PERMISSIONS', active: false },
            { label: 'Integrations', route: '/home/settings/integrations', key: 'INTEGRATIONS', active: false }
        ]
    },
]

export const TOP_NAV_TABS_CONFIG = [
    /* ===== LEAVE ADMIN ===== */
    { subFeatureKey: 'LEAVE_ADMIN', label: 'Leave Types', route: '/home/leave/admin/leave-types' },
    { subFeatureKey: 'LEAVE_ADMIN', label: 'Leave Policies', route: '/home/leave/admin/leave-policies' },
    { subFeatureKey: 'LEAVE_ADMIN', label: 'Holiday Calendar', route: '/home/leave/admin/holidays' },
    { subFeatureKey: 'LEAVE_ADMIN', label: 'Weekly Off', route: '/home/leave/admin/weekly-off' },
    { subFeatureKey: 'LEAVE_ADMIN', label: 'Simulation', route: '/home/leave/admin/simulation' },

    /* ===== ATTENDANCE ADMIN ===== */
    { subFeatureKey: 'ATTENDANCE_ADMIN', label: 'Attendance Rules', route: '/home/attendance/admin/rules' },
    { subFeatureKey: 'ATTENDANCE_ADMIN', label: 'Shift Configuration', route: '/home/attendance/admin/shifts' },
    { subFeatureKey: 'ATTENDANCE_ADMIN', label: 'Work Type', route: '/home/attendance/admin/work-type' },
    { subFeatureKey: 'ATTENDANCE_ADMIN', label: 'Geo / IP Rules', route: '/home/attendance/admin/geo-ip' },
    { subFeatureKey: 'ATTENDANCE_ADMIN', label: 'Simulation', route: '/home/attendance/admin/simulation' },

    /* ===== RECRUITMENT ADMIN ===== */
    { subFeatureKey: 'RECRUITMENT_ADMIN', label: 'Hiring Stages', route: '/home/recruitment/admin/stages' },
    { subFeatureKey: 'RECRUITMENT_ADMIN', label: 'Interview Panels', route: '/home/recruitment/admin/panels' },
    { subFeatureKey: 'RECRUITMENT_ADMIN', label: 'Offer Templates', route: '/home/recruitment/admin/offers' },

    /* ===== PAYROLL ADMIN ===== */
    { subFeatureKey: 'PAYROLL_ADMIN', label: 'Salary Components', route: '/home/payroll/admin/components' },
    { subFeatureKey: 'PAYROLL_ADMIN', label: 'Pay Structures', route: '/home/payroll/admin/structures' },
    { subFeatureKey: 'PAYROLL_ADMIN', label: 'Statutory Settings', route: '/home/payroll/admin/statutory' },

    /* ===== PERFORMANCE ADMIN ===== */
    { subFeatureKey: 'PERFORMANCE_ADMIN', label: 'Review Cycles', route: '/home/performance/admin/cycles' },
    { subFeatureKey: 'PERFORMANCE_ADMIN', label: 'Rating Scales', route: '/home/performance/admin/ratings' },

    /* ===== ASSETS ADMIN ===== */
    { subFeatureKey: 'ASSETS_ADMIN', label: 'Asset Categories', route: '/home/assets/admin/categories' },
    { subFeatureKey: 'ASSETS_ADMIN', label: 'Vendors', route: '/home/assets/admin/vendors' },

    /* ===== PLATFORM MANAGEMENT ===== */
    { subFeatureKey: 'PLATFORM_DASHBOARD', label: 'Overview', route: '/home/platform-management/dashboard' },
    { subFeatureKey: 'ORGANIZATIONS', label: 'Settings', route: '/home/platform-management/organizations/settings' },
    { subFeatureKey: 'GLOBAL_ADMIN_USERS', label: 'Roles', route: '/home/platform-management/global-admin/roles' },
    { subFeatureKey: 'SUBSCRIPTION_PLANS', label: 'Pricing', route: '/home/platform-management/subscription-plans/pricing' },
    { subFeatureKey: 'MODULE_FEATURE_MANAGEMENT', label: 'Features', route: '/home/platform-management/module-feature-management/features' },
    { subFeatureKey: 'USAGE_LIMITS', label: 'Audit Logs', route: '/home/platform-management/usage-limits/audit' }
];


