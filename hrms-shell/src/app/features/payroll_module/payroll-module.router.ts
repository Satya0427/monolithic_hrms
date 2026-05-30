import { Routes } from "@angular/router";

export const PAYROLL_MODULE_ROUTES: Routes = [
    {
        path: 'payroll-structure', loadComponent: () => import('./payroll-module').then(m => m.PayrollModule),
        children: [
            { path: 'components', loadComponent: () => import('./payroll-structure/payroll-components/payroll-components').then(m => m.PayrollComponents) },
            { path: 'templates', loadComponent: () => import('./payroll-structure/payroll-templates/payroll-templates').then(m => m.PayrollTemplates) },
            { path: 'templates/create', loadComponent: () => import('./payroll-structure/payroll-templates/create-template/create-template').then(m => m.CreateTemplate) },
            { path: 'templates/edit/:id', loadComponent: () => import('./payroll-structure/payroll-templates/create-template/create-template').then(m => m.CreateTemplate) },
            { path: 'employee-assignment', loadComponent: () => import('./payroll-structure/employee-assignment/employee-assignment').then(m => m.EmployeeAssignment) },
            { path: '', redirectTo: 'components', pathMatch: 'full' }
        ]
    },
    {
        path: 'run-payroll', loadComponent: () => import('./run-payroll/run-payroll').then(m => m.RunPayroll),
        children: [
            { path: 'payroll-process', loadComponent: () => import('./run-payroll/payroll-process/payroll-process').then(m => m.PayrollProcess) },
            {path:'payroll-history', loadComponent: () => import('./run-payroll/payroll-history/payroll-history').then(m => m.PayrollHistory)},
            {path:'locked-payroll', loadComponent: () => import('./run-payroll/locked-payroll/locked-payroll').then(m => m.LockedPayroll)},
            { path: '', redirectTo: 'payroll-process', pathMatch: 'full' }
        ]
    },
    { path: '', redirectTo: 'payroll-structure', pathMatch: 'full' }
]
