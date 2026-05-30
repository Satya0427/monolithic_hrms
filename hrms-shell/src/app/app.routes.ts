import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
    {
        path: 'auth',
        children: [
            {
                path: 'login',
                loadComponent: () => import('./features/auth/login/login').then(m => m.Login)
            },
            {
                path: 'register',
                loadComponent: () => import('./features/auth/register/register').then(m => m.Register)
            },
            { path: '', redirectTo: 'login', pathMatch: 'full' }
        ]
    },
    { path: 'home', canActivate: [authGuard], loadChildren: () => import('./layout/Routers/layout.routes').then(m => m.layoutRoutes) },
    { path: '', redirectTo: 'auth/login', pathMatch: 'full' },

    { path: '**', redirectTo: 'auth/login' }
];
