import { Routes } from '@angular/router';
import { PlatformAdmin } from './platform-admin';


export const PLATFORM_MANAGEMENT_ROUTES: Routes = [
    {
        path: '', component: PlatformAdmin, children: [
            { path: 'orginization', loadChildren: () => import('./orginizations/orginization.routes').then(m => m.ORGINIZATION_ROUTES) },
            { path: 'global-admin', loadChildren: () => import('./global-admin/global-admin.routes').then(m => m.GLOBAL_ADMIN_ROUTES) },
            { path: 'subscription-plan', loadChildren: () => import('./subscription/subscription-plan.routes').then(m => m.SUBSCRIPTION_PLAN_ROUTES) },
            { path: 'module-featurs-management', loadChildren: () => import('.//module-features-management/platform-module.routes').then(m => m.MODULE_FEATURES_MANAGEMENT_ROUTES) },
            { path: 'platform-dashboard', loadChildren: () => import('./platform-dashboard/platform-dashboard.routes').then(m => m.PLATFORM_DASHBOARD_ROUTES) },
            { path: 'usage-limit', loadChildren: () => import('./usage-limits/usage-limits.routes').then(m => m.USATE_LIMIT_ROUTES) },
            { path: '', redirectTo: 'orginization', pathMatch: 'full' }
        ]
    },

];
