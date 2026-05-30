import { Routes } from "@angular/router";

export const ATTENDANCE_ROUTES: Routes = [
    { path: 'my-attendance', loadComponent: () => import('./my-attendance/my-attendance').then(m => m.MyAttendance) },
    { path: 'my-attendance/:id', loadComponent: () => import('./my-attendance/my-attendance').then(m => m.MyAttendance) },
    { path: 'team-attendance', loadComponent: () => import('./team-attendance/team-attendance').then(m => m.TeamAttendance) },
];