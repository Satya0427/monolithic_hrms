import { Routes } from "@angular/router";
import { Layout } from "../layout/layout";
import { loadRemoteModule } from '@angular-architects/module-federation';


export const layoutRoutes: Routes = [
    {
        path: '',
        component: Layout,
        children: [
            // { path: 'dashboard-module', },
            { path: 'employee-module', loadChildren: () => import('../../features/employee/employee.router').then(m => m.EMPLOYEE_ROUTES) },
            { path: 'leave-management-module', loadChildren: () => import('../../features/leave-management/leave-management.router').then(m => m.LEAVE_ROUTES) },
            { path: 'attendance-module', loadChildren: () => import('../../features/attendance/attendance.router').then(m => m.ATTENDANCE_ROUTES), },

            { path: 'payroll-module', loadChildren: () => import('../../features/payroll_module/payroll-module.router').then(m => m.PAYROLL_MODULE_ROUTES) },
            { path: 'requests-module', loadChildren: () => import('../../features/requests/request.router').then(m => m.REQUEST_ROUTER) },

            { path: '**', redirectTo: 'employees', },
            { path: '', redirectTo: 'hrms-core', pathMatch: 'full' }
        ]

    }
]