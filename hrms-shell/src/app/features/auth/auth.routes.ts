import { Routes } from '@angular/router';

export const authRoutes: Routes = [
    {
        path: '',
        children: [
            {
                path: 'login',
                loadComponent: () => import('../../../app/features/auth/login/login').then(m => m.Login)
            },
            { path: '', redirectTo: 'login', pathMatch: 'full' }
        ]
    }
];
