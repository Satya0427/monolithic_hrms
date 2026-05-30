import { Routes } from '@angular/router';
import { Employee } from './employee';
import { EmployeeList } from './employee-list/employee-list';
import { EmployeeOnboarding } from './employee-list/employee-onboarding/employee-onboarding';
// import { Recruitment } from './features/recruitment/recruitment';

export const EMPLOYEE_ROUTES: Routes = [
    {
        path: '', component: Employee, children: [
            { path: 'employee-list', component: EmployeeList },
            { path: 'employee-onboarding', component: EmployeeOnboarding },
            { path: 'employee-edit/:id', component: EmployeeOnboarding },
            { path: '', redirectTo: 'employee-list', pathMatch: 'full', },
            { path: '**', redirectTo: 'employee-list', },
        ]
    },
    { path: '', redirectTo: 'employee', pathMatch: 'full', },
    { path: '**', redirectTo: 'employee', },
];