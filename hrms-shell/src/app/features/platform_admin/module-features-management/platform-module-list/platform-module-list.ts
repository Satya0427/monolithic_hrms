import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { MATERIAL } from '../../../../shared/material/materials';
import { ApiClient } from '../../../../core/services/api-client.service';
import { API_ENDPOINTS } from '../../../../core/config/api-endpoints';

@Component({
  selector: 'app-platform-module-list',
  imports: [MATERIAL, FormsModule, CommonModule, RouterModule],
  templateUrl: './platform-module-list.html',
  styleUrl: './platform-module-list.scss',
})
export class PlatformModuleList {
  displayedColumns = [
    'name',
    'code',
    'features',
    'status',
    'actions'
  ];
  modules: any[] = [];

  private _http = inject(ApiClient);
  private _toastr = inject(ToastrService);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.getModuleList();
  }

  getModuleList() {
    this._http.get(API_ENDPOINTS.platformModules.get_all).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const data = res?.data || res;
        if (Array.isArray(data)) {
          this.modules = data.map((m: any) => ({
            id: m._id || m.id,
            name: m.module_name || m.module_name || '',
            code: m.module_code || m.module_code || '',
            icon: m.icon || '',
            features: Array.isArray(m.features) ? m.features.length : 0,
            status: m.active ? 'Enabled' : 'Disabled',
            createdAt: m.createdAt
          }));
        }
      },
      error: (err: any) => {
        console.error('Failed to fetch modules', err);
        this._toastr.error('Failed to load platform modules');
      }
    });
  }
}
