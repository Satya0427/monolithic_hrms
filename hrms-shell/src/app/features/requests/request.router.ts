import { Routes } from "@angular/router";
import { Request } from "./request";
import { LeaveRequests } from "./leave-requests/leave-requests";

export const REQUEST_ROUTER: Routes = [
    {
        path: '', component: Request,
        children: [
            { path: 'leave-requests', component: LeaveRequests },
            { path: 'attendance-regularization', loadComponent: () => import('./attendance-regurilization-request/attendance-regurilization-request').then(m => m.AttendanceRegurilizationRequest) },
            { path: 'wfh-requests', loadComponent: () => import('./work-from-home-requests/work-from-home-requests').then(m => m.WorkFromHomeRequests) },
            { path: '', redirectTo: 'leave-requests', pathMatch: 'full' },
        ]
    }
]