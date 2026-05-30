import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from "@angular/router";
import { GlobalAdminStatusDialog } from '../global-admin-status-dialog/global-admin-status-dialog';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { MATERIAL } from '../../../../shared/material/materials';
import { ApiClient } from '../../../../core/services/api-client.service';
import { API_ENDPOINTS } from '../../../../core/config/api-endpoints';

@Component({
  selector: 'app-global-admin-list',
  imports: [MATERIAL, CommonModule, RouterModule],
  templateUrl: './global-admin-list.html',
  styleUrl: './global-admin-list.scss',
})
export class GlobalAdminList implements OnInit {
  private dialog = inject(MatDialog)
  private _http = inject(ApiClient);
  private _toastr = inject(ToastrService);
  private destroy$ = new Subject<void>();
  displayedColumns = [
    'name',
    'email',
    'organization',
    'status',
    'created',
    'actions'
  ];

  globalAdmins: any[] = [];

  ngOnInit(): void {
    this.getAdminList();
  }

  getAdminList() {
    const payload = {
      page: '1',
      limit: '100',
      search_key: ''
    };
    this._http.post(API_ENDPOINTS.globalAdmin.get_all, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (_res: any) => {
        const data = _res?.data?.admin_data || []
        if (data && Array.isArray(data)) {
          this.globalAdmins = data.map((a: any) => ({
            id: a.id || a._id,
            name: a.name || a.admin_name || '',
            email: a.email || a.contact_email || '',
            organization: a.organization_name || a.organization?.name || '',
            status: (a.status && typeof a.status === 'string') ? (a.status.toLowerCase() === 'active' ? 'Active' : a.status) : (a.is_active ? 'Active' : 'Inactive'),
            created: a.createdAt || a.created || new Date()
          }));
        }
      },
      error: (err: any) => {
        console.error('Failed to load admins', err);
        this._toastr.error('Failed to load global admins');
      }
    });
  }

  openStatusDialog(admin: any) {
    const dialogRef = this.dialog.open(GlobalAdminStatusDialog, {
      width: '420px',
      data: {
        status: admin.status === 'Active' ? 'deactivate' : 'activate',
        adminName: admin.name
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        admin.status = admin.status === 'Active' ? 'Inactive' : 'Active';
      }
    });
  }

}
