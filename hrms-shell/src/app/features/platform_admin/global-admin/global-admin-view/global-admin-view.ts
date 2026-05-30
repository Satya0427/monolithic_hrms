import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { MATERIAL } from '../../../../shared/material/materials';
import { ApiClient } from '../../../../core/services/api-client.service';
import { API_ENDPOINTS } from '../../../../core/config/api-endpoints';

@Component({
  selector: 'app-global-admin-view',
  imports: [MATERIAL, CommonModule, RouterModule],
  templateUrl: './global-admin-view.html',
  styleUrl: './global-admin-view.scss',
})
export class GlobalAdminView implements OnInit {
  private _fb = inject(FormBuilder);
  private _httpClient = inject(ApiClient);
  private _router = inject(Router);
  private _toastr = inject(ToastrService);
  private _route = inject(ActivatedRoute);

  adminId!: string
  admin_details = signal<any>({});
  destroy$ = new Subject<void>()
  
  ngOnInit(): void {
    this._route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.adminId = params.get('id') || '';
      if (this.adminId) {
        this.getAdminDetails();
      }
    });
  }

  // Get Admin Details API Call
  getAdminDetails() {
    if (!this.adminId) return;
    const payload = {
      "adminId": this.adminId
    };
    this._httpClient.post(API_ENDPOINTS.globalAdmin.get_by_id, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (_res: any) => {
        if (_res?.data) {
          this.admin_details.set(_res.data);
          console.log('Admin details loaded:', _res.data);
          this._toastr.success('Admin details loaded successfully');
        }
      },
      error: (_err: any) => {
        console.error('Error fetching admin details:', _err);
        this._toastr.error('Failed to load admin details');
      },
      complete: () => {
      }
    });
  }
}
