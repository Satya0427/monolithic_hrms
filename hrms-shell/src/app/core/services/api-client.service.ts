import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environement';

@Injectable({
  providedIn: 'root',
})
export class ApiClient {
  private http = inject(HttpClient);
  private apiUrl = environment.baseApiUrl;

  // Generic GET method
  get<T>(path: string, options: any = {}) {
    const opts = { ...options, withCredentials: true };
    return this.http.get<T>(`${this.apiUrl}${path}`, opts)
      .pipe(catchError(this.handleError));
  }

  // Generic POST method
  post<T>(path: string, body: any, options: any = {}): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${path}`, body, options) as Observable<T>;
  }

  // Generic DELETE method
  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${path}`)
      .pipe(catchError(this.handleError));
  }

  // Error handling
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Server returned code: ${error.status}, message: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
