import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { Subject } from 'rxjs';
import { ApiClient } from '../../../core/services/api-client.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-base-component',
  imports: [],
  templateUrl: './base-component.html',
  styleUrl: './base-component.css',
})
export class BaseComponent {
  protected _router = inject(Router);
  protected _breadcrumb = inject(BreadcrumbService);
  protected _apiService = inject(ApiClient);
  protected _toastr = inject(ToastrService);  
  
  protected readonly destroy$ = new Subject<void>();

  // simple navigate helper
  protected navigateTo(path: string | any[], extras?: { replaceUrl?: boolean }) {
    if (Array.isArray(path)) {
      this._router.navigate(path, extras);
    } else {
      this._router.navigate([path], extras);
    }
  }

  // breadcrumb helper
  protected setBreadcrumb(items: { label: string; link?: string, active?: boolean }[]) {
    this._breadcrumb.setBreadcrumb(items);
  }

  // small error handler that components can override
  protected handleError(error: any) {
   this._toastr.error(error || 'An error occurred. Please try again.', 'Error');
  }




  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
