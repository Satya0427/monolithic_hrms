import { Routes } from "@angular/router";
import { PlatformDashboard } from "./platform-dashboard";

export const PLATFORM_DASHBOARD_ROUTES: Routes = [
    { path: 'platform-dasboard', component: PlatformDashboard },
    { path: '', redirectTo: 'platform-dasboard', pathMatch: 'full' }
]