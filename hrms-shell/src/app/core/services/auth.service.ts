import { inject, Injectable } from '@angular/core';
import { ApiClient } from './api-client.service';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { BaseComponent } from '../../shared/components/base-component/base-component';
import { map, Observable, take, takeUntil, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService extends BaseComponent {
  private _service = inject(ApiClient)

  getAccessToken(): string | null {
    const raw = sessionStorage.getItem('Token');
    if (!raw) return null;
    try {
      const token = JSON.parse(raw);
      return token ?? null;
    } catch (e) {
      console.error('Failed to parse userDetails from sessionStorage', e);
      return null;
    }
  }

  setAccessToken(token: string | null) {
    if (token) sessionStorage.setItem('Token', JSON.stringify(token));
    else sessionStorage.removeItem('Token');
  }

  getRefreshToken(): Observable<string | null> {
    return this._service.get(API_ENDPOINTS.auth.refreshToken).pipe(
      map((r: any) => {
        return r?.token?.accessToken ?? null;
      }),
      tap((token: string | null) => {
        if (!token) {
          return;
        }
        this.setAccessToken(token);
      })
    );
  }
  


  logout() {
    sessionStorage.removeItem('userDetails');
  }
}
