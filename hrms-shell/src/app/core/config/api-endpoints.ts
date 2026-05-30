export const API_ENDPOINTS = {
    auth: {
        login: `/auth/login`,
        register: `/users/register_admin`,
        refreshToken: `/auth/token_refresh`,
        logout: `/auth/logout`
    },
    users: {
        getUsersList: `/user/users-list`,
        createUser: `/user/creation`,
        editUser: `/users/V1/edit`,
    },

    lookups: {
        orginization_dropdown:'/lookup/organizations-dropdown'
    },
    // Global Admin Users Management
    globalAdmin: {
        get_all: `/org-admin/get_admins`,
        get_by_id: `/org-admin/get_details`,
        create: `/org-admin/create`,
        update: `/org-admin/:id`,
        delete: `/org-admin/:id`,
        change_status: `/org-admin/:id/status`,
    },

    // Organizations Management
    organizations: {
        get_all: `/organization/orginization_list`,
        get_by_id: `/organization/org_dtls_by_id`,
        get_org_details: `/organization/orginization_view_details`,
        create: `/organization/create`,
        update: `/organization/:id`,
        delete: `/organization/:id`,
        change_status: `/organization/:id/status`,
        get_usage: `/organization/:id/usage`,
    },

    // Subscription Plans Management
    subscriptionPlans: {
        get_all: `/subscription-plans`,
        get_by_id: `/subscription-plans/:id`,
        create: `/subscription-plans`,
        update: `/subscription-plans/:id`,
        delete: `/subscription-plans/:id`,
        change_status: `/subscription-plans/:id/status`,
    },

    // Subscription Plan Endpoints
    subscription: {
        create_plan: `/subscription/create`,
        get_all_plans: `/subscription/get_list`,
        get_plan_by_id: `/subscription/edit_plan`,
        update_plan: `/subscription/subscription-plans/:id`,
        delete_plan: `/subscription/subscription-plans/:id`,
        get_plan_features: `/subscription/subscription-plans/:id/features`,
    },

    // Platform Modules Management
    platformModules: {
        get_all: `/module-feature/get_modules_list`,
        get_by_id: `/module-feature/:id`,
        create: `/module-feature/create`,
        update: `/module-feature/:id`,
        delete: `/module-feature/:id`,
        toggle_status: `/module-feature/:id/toggle`,
    },

    // Platform Dashboard
    dashboard: {
        get_kpi_stats: `/dashboard/kpi-stats`,
        get_usage_overview: `/dashboard/usage-overview`,
        get_module_adoption: `/dashboard/module-adoption`,
        get_revenue_snapshot: `/dashboard/revenue-snapshot`,
        get_system_health: `/dashboard/system-health`,
    },

    // Usage Limits & Monitoring
    usageLimits: {
        get_all_organization_usage: `/usage-limits/organizations`,
        get_organization_usage: `/usage-limits/organizations/:id`,
        get_organization_usage_details: `/usage-limits/organizations/:id/details`,
        alert_threshold: `/usage-limits/alert-thresholds`,
    },

    
    gallery: {
        getImages: `/gallery/view_images`
    },
    sideNav: {
        get_menus_by_role: `/module-feature/get_modules_list_by_role`,
        get_menus: `/module-feature/get_modules_list`
    },
    lookup: {
        getLookupData: `/common/lookup`,
        getBulkLookupData: `/common/bulk_lookup`,
        categories: {
            gender: 'GENDER',
            employee_type: 'EMPLOYEE_TYPE',
            work_mode: 'WORK_MODE',
            status: 'STATUS',
            emergency_relation: 'EMERGENCY_RELATION',
            probation_status: 'PROBATION_STATUS'
        }
    },
    dropdown: {
        designations: '/common/designations-dropdown',
        departments: '/common/departments-dropdown',
        employees: '/common/employee-dropdown',
        leave_types: '/common/leave-types-dropdown',
        roles: '/common/roles-dropdown',
        shifts: '/common/shifts-dropdown'
    },
    common: {
        employee_list_by_manager: '/common/employees-by-manager',
    },
    employee: {
        create: `/onboarding/employee-onboarding`,
        get_employee_list: `/onboarding/employee-list-pagination`,
        get_employee_details: `/onboarding/employee-details`,
        auto_generated_emp_id: `/onboarding/auto_generated_emp_id`,
        uploadDocument: `/onboarding/upload-document`,
        getDocuments: `/onboarding/get-document`,
        saveCompensation: `/onboarding/save-compensation`,
        getCompensation: `/onboarding/get-compensation`
    },
    leave: {
        save_leave_types: '/leave-config/leave_type/create',
        get_leave_types: '/leave-config/leave_type/get_list',
        status_change_leave_type: '/leave-config/leave_type/change_status',

        create_policy: '/leave-config/leave_policy/create',
        get_policies: '/leave-config/leave_policy/get_list',
        delete_policy: '/leave-config/leave_policy/delete',
        get_policy_details: '/leave-config/leave_policy/get_by_id',

        create_holiday: '/leave-config/leave_calendar/holiday/create',
        get_holidays: '/leave-config/leave_calendar/holiday/get_list',
        update_holiday: '/leave-config/holiday/update',
        delete_holiday: '/leave-config/leave_calendar/holiday/delete',

        create_weekly_off: '/leave-config/leave_calendar/weekly_off/create',

        // Leave Balance & Ledger
        get_leave_balance: '/leave-config/leave_balance/get_by_employee',

        // Leave Request (Apply Leave)
        apply_leave: '/leave-config/leave_requests/apply',
        check_leave_overlap: '/leave-config/leave_requests/check_overlap',

        // leave approval
        get_pending_requests: '/leave-config/leave_requests/get_list',
        update_request_status: '/leave-config/leave_requests/update_status'
    },
    attendance: {
        clock_in: '/attendance/check_in',
        clock_out: '/attendance/check_out',
        wfh_clock_in: '/attendance/wfh/check_in',
        attendance_calculation: '/attendance/calculate',
        get_clock_status: '/attendance/history',
        get_monthly_attendance: '/attendance/monthly-summary',

        get_clock_logs: '/attendance/clock_logs',
        rise_wfh_request: '/attendance/wfh/rise-request',
        get_wfh_requests_list: '/attendance/wfh/requests-list',
        update_wfh_request_status: '/attendance/wfh/status-update',

        get_my_attendance: '/attendance/my-attendance',
        request_regularization: '/attendance/regularization/request',

    },
    payroll: {
        // Salary Components
        create_component: '/payroll/component/create',
        get_components: '/payroll/component/get_all',
        update_component: '/payroll/component/update',
        get_component_by_id: '/payroll/component/get_by_id',
        toggle_component_status: '/payroll/component/toggle-status-change',
        delete_component: '/payroll/component/delete',

        // Salary Templates
        create_template: '/payroll/template/create',
        get_templates: '/payroll/template/get_list',
        get_template_by_id: '/payroll/template/get_by_id',
        update_template: '/payroll/template/update',
        duplicate_template: '/payroll/template/duplicate',
        toggle_template_status: '/payroll/template/toggle_status_change',
        delete_template: '/payroll/template/delete',
        get_template_for_assignment: '/payroll/template/for_assignment',

        // Employee Assignment
        assign_salary: '/payroll/employee-assignment/assign',
        get_assignments: '/payroll/employee-assignment/get_list',
        get_assignment_by_employee: '/payroll/employee-assignment/get_by_employee_id',
        get_salary_history: '/payroll/employee-assignment/history',
        revise_salary: '/payroll/employee-assignment/revise',
        deactivate_assignment: '/payroll/employee-assignment/deactivate',
        remove_assignment: '/payroll/employee-assignment/remove',

        // Payroll Process Engine (Run Lifecycle)
        create_payroll_run: '/run-payroll/process',
        get_payroll_runs: '/run-payroll/get-list',
        get_employee_by_runId: '/run-payroll/get-employees', // ?runId=xxx&employeeId=yyy
        recalculate_payroll: '/run-payroll/recalculate', // ?runId=xxx&employeeId=yyy
        mark_payroll_processed: '/run-payroll/mark-processed', // { runId: xxx }
        approve_payroll: '/run-payroll/approve', // { runId: xxx }
        lock_payroll: '/run-payroll/lock', // { runId: xxx }
        reverse_payroll: '/run-payroll/reverse', // { runId: xxx }

    }
};