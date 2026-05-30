import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbService {
  private breadcrumb$ = new BehaviorSubject<any[]>([]);
  breadcrumbs = this.breadcrumb$.asObservable();

  setBreadcrumb(items: any[]) {
    this.breadcrumb$.next(items);
  }


  clear() {
    this.breadcrumb$.next([]);
  }
}
