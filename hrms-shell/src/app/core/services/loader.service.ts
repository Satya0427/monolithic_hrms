import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  private _loading = new BehaviorSubject<boolean>(false);
  loading$ = this._loading.asObservable();
  private activeRequests = 0;

  show(): void {
    this.activeRequests++;
    if (!this._loading.value) {
      this._loading.next(true);
    }
  }

  hide(): void {
    this.activeRequests = Math.max(this.activeRequests - 1, 0);
    if (this.activeRequests === 0) {
      this._loading.next(false);
    }
  }
}
