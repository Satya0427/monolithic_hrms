import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, finalize, map, switchMap, take, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from '../services/loader.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);
  const router = inject(Router);
  const toaster = inject(ToastrService);
  const _loader = inject(LoaderService)


  const addAuthHeader = (request: HttpRequest<any>, token: string | null) => {
    if (!token) return request;
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  };

  const token = authService.getAccessToken();
  const authReq = addAuthHeader(req, token);

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const is401 = error.status === 401 || (error.error && error.error.sts === 401);
      const is403 = error.status === 403 || (error.error && error.error.sts === 403);
      if (is401) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);
          return authService.getRefreshToken().pipe(
            map((res: any) => {
              if (!res) return null;
              if (typeof res === 'string') return res;
              return res.accessToken || res.token || null;
            }),
            switchMap((newToken: string | null) => {
              if (!newToken) {
                refreshTokenSubject.next(null);
                try { authService.setAccessToken(null); } catch (e) { }
                toaster.error('Session expired. Please login again.', 'Session');
                router.navigate(['/auth/login']);
                return throwError(() => new Error('No token returned from refresh'));
              }
              try { authService.setAccessToken(newToken); } catch (e) { }
              refreshTokenSubject.next(newToken);
              const retryReq = addAuthHeader(req, newToken);
              return next(retryReq);
            }),
            catchError((refreshErr) => {
              try { authService.setAccessToken(null); } catch (e) { }
              refreshTokenSubject.next(null);
              toaster.error('Session expired. Please login again.', 'Session');
              router.navigate(['/auth/login']);
              return throwError(() => refreshErr);
            }),
            finalize(() => {
              isRefreshing = false;
              try { _loader.hide(); } catch (e) { }
            })
          );
        } else {
          return refreshTokenSubject.pipe(
            filter((token): token is string => token !== null),
            take(1),
            switchMap((newToken) => {
              const retryReq = addAuthHeader(req, newToken);
              return next(retryReq);
            }),
            catchError((err) => {
              try { authService.setAccessToken(null); } catch (e) { }
              router.navigate(['/auth/login']);
              return throwError(() => err);
            })
          );
        }
      }

      if (is403) {
        router.navigate(['/not-authorized']);
      } else {
        console.error('HTTP Error:', error);
      }

      toaster.error(error.error?.msg || 'An unexpected error occurred.', 'Error');
      return throwError(() => error);
    })
  );
};
