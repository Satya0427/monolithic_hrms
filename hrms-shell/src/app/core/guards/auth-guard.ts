import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const isLoggedIn = sessionStorage.getItem('Token') !== null;
  if (isLoggedIn) {
    return true;
  } else {
    console.log('Dont have permession to this route')
    return router.createUrlTree(['/auth/login']);
  }
};
