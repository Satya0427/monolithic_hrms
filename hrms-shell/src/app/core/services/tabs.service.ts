export const TOP_NAV_TABS_CONFIG = [
    /* ===== LEAVE ADMIN ===== */
    { subFeatureKey: 'LEAVE_ADMIN', key: 'LEAVE_TYPES', label: 'Leave Types', route: '/home/leave-management-module/leave-management' },
    { subFeatureKey: 'LEAVE_ADMIN', key: 'LEAVE_POLICIES', label: 'Leave Policies', route: '/home/leave-management-module/leave-policy' },
    { subFeatureKey: 'LEAVE_ADMIN', key: 'HOLIDAY_CALENDAR', label: 'Holiday Calendar', route: '/home/leave-management-module/holiday-calendar' },
    { subFeatureKey: 'LEAVE_ADMIN', key: 'WEEKLY_OFF', label: 'Weekly Off', route: '/home/leave-management-module/week-off-config' },
    // { subFeatureKey: 'LEAVE_ADMIN', key: 'SIMULATION', label: 'Simulation', route: '/home/leave-management-module/leave-simulation' },

    /* ===== LEAVE BALANCE ===== */
    { subFeatureKey: 'LEAVE_BALANCE', key: 'EMPLOYEE_LIST', label: 'Employee List', route: '/home/leave-management-module/employee-list' },
    { subFeatureKey: 'LEAVE_BALANCE', key: 'DASHBOARD', label: 'Leave Balance & Ledger', route: '/home/leave-management-module/leave-balance' },
    { subFeatureKey: 'LEAVE_BALANCE', key: 'LEAVE_REQUESTS', label: 'Leave Requests', route: '/home/leave-management-module/leave-requests' },

    /* ===== ATTENDANCE ADMIN ===== */
    { subFeatureKey: 'ATTENDANCE_ADMIN', key: 'ATTENDANCE_RULES', label: 'Attendance Rules', route: '/home/attendance/admin/rules' },
    { subFeatureKey: 'ATTENDANCE_ADMIN', key: 'SHIFT_CONFIGURATION', label: 'Shift Configuration', route: '/home/attendance/admin/shifts' },
    { subFeatureKey: 'ATTENDANCE_ADMIN', key: 'WORK_TYPE', label: 'Work Type', route: '/home/attendance/admin/work-type' },
    { subFeatureKey: 'ATTENDANCE_ADMIN', key: 'GEO_IP_RULES', label: 'Geo / IP Rules', route: '/home/attendance/admin/geo-ip' },
    { subFeatureKey: 'ATTENDANCE_ADMIN', key: 'ATTENDANCE_SIMULATION', label: 'Simulation', route: '/home/attendance/admin/simulation' },

    /* ===== RECRUITMENT ADMIN ===== */
    { subFeatureKey: 'RECRUITMENT_ADMIN', key: 'HIRING_STAGES', label: 'Hiring Stages', route: '/home/recruitment/admin/stages' },
    { subFeatureKey: 'RECRUITMENT_ADMIN', key: 'INTERVIEW_PANELS', label: 'Interview Panels', route: '/home/recruitment/admin/panels' },
    { subFeatureKey: 'RECRUITMENT_ADMIN', key: 'OFFER_TEMPLATES', label: 'Offer Templates', route: '/home/recruitment/admin/offers' },

    /* ===== PAYROLL ADMIN ===== */
    { subFeatureKey: 'PAYROLL_ADMIN', key: 'SALARY_COMPONENTS', label: 'Salary Components', route: '/home/payroll/admin/components' },
    { subFeatureKey: 'PAYROLL_ADMIN', key: 'PAY_STRUCTURES', label: 'Pay Structures', route: '/home/payroll/admin/structures' },
    { subFeatureKey: 'PAYROLL_ADMIN', key: 'STATUTORY_SETTINGS', label: 'Statutory Settings', route: '/home/payroll/admin/statutory' },

    /* ===== PERFORMANCE ADMIN ===== */
    { subFeatureKey: 'PERFORMANCE_ADMIN', key: 'REVIEW_CYCLES', label: 'Review Cycles', route: '/home/performance/admin/cycles' },
    { subFeatureKey: 'PERFORMANCE_ADMIN', key: 'RATING_SCALES', label: 'Rating Scales', route: '/home/performance/admin/ratings' },

    /* ===== ASSETS ADMIN ===== */
    { subFeatureKey: 'ASSETS_ADMIN', key: 'ASSET_CATEGORIES', label: 'Asset Categories', route: '/home/assets/admin/categories' },
    { subFeatureKey: 'ASSETS_ADMIN', key: 'VENDORS', label: 'Vendors', route: '/home/assets/admin/vendors' },

    /* ===== PLATFORM MANAGEMENT ===== */
    { subFeatureKey: 'PLATFORM_DASHBOARD', key: 'OVERVIEW', label: 'Overview', route: '/home/platform-management/dashboard' },
    { subFeatureKey: 'ORGANIZATIONS', key: 'SETTINGS', label: 'Settings', route: '/home/platform-management/organizations/settings' },
    { subFeatureKey: 'GLOBAL_ADMIN_USERS', key: 'ROLES', label: 'Roles', route: '/home/platform-management/global-admin/roles' },
    { subFeatureKey: 'SUBSCRIPTION_PLANS', key: 'PRICING', label: 'Pricing', route: '/home/platform-management/subscription-plans/pricing' },
    { subFeatureKey: 'MODULE_FEATURE_MANAGEMENT', key: 'FEATURES', label: 'Features', route: '/home/platform-management/module-feature-management/features' },
    { subFeatureKey: 'USAGE_LIMITS', key: 'AUDIT_LOGS', label: 'Audit Logs', route: '/home/platform-management/usage-limits/audit' },

    /* ===== PAYROLL TEMPLATE WIZARD ===== */
    { subFeatureKey: 'PAYROLL_TEMPLATE_WIZARD', key: 'BASIC_INFO', label: 'Basic Information' },
    { subFeatureKey: 'PAYROLL_TEMPLATE_WIZARD', key: 'EARNINGS_CONFIG', label: 'Earnings Configuration' },
    { subFeatureKey: 'PAYROLL_TEMPLATE_WIZARD', key: 'DEDUCTIONS_CONFIG', label: 'Deductions Configuration' },
    { subFeatureKey: 'PAYROLL_TEMPLATE_WIZARD', key: 'CTC_PREVIEW', label: 'CTC Distribution & Preview' },
    { subFeatureKey: 'PAYROLL_TEMPLATE_WIZARD', key: 'DISPLAY_CONTROLS', label: 'Display & Controls' },

    /* ===== EMPLOYEE PROFILE ===== */
    { subFeatureKey: 'EMPLOYEE_ONBOARDING', key: 'ONBOARDING', label: 'Onboarding', },
    { subFeatureKey: 'EMPLOYEE_ONBOARDING', key: 'BANK_AND_DOCUMENT', label: 'Bank And Document', },
    { subFeatureKey: 'EMPLOYEE_ONBOARDING', key: 'COMPENSATION', label: 'Compensation', },

    /* ===== ATTENDANCE ADMIN ===== */
    { subFeatureKey: 'ATTENDANCE_ADMIN', label: 'Attendance Rules', route: '/home/attendance/admin/rules' },
    { subFeatureKey: 'ATTENDANCE_ADMIN', label: 'Shift Configuration', route: '/home/attendance/admin/shifts' },
    { subFeatureKey: 'ATTENDANCE_ADMIN', label: 'Work Types', route: '/home/attendance/admin/work-types' },
    { subFeatureKey: 'ATTENDANCE_ADMIN', label: 'Geo / IP Rules', route: '/home/attendance/admin/geo-ip' },
    { subFeatureKey: 'ATTENDANCE_ADMIN', label: 'Attendance Policies', route: '/home/attendance/admin/policies' },
    { subFeatureKey: 'ATTENDANCE_ADMIN', label: 'Simulation', route: '/home/attendance/admin/simulation' }

];