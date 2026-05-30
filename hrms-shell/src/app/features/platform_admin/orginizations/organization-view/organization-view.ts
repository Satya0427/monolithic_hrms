import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from "@angular/router";
import { OrganizationStatusDialog } from '../organization-status-dialog/organization-status-dialog';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { MATERIAL } from '../../../../shared/material/materials';
import { ApiClient } from '../../../../core/services/api-client.service';
import { API_ENDPOINTS } from '../../../../core/config/api-endpoints';

@Component({
  selector: 'app-organization-view',
  imports: [MATERIAL, CommonModule, RouterModule],
  templateUrl: './organization-view.html',
  styleUrl: './organization-view.scss',
})
export class OrganizationView implements OnInit {
  private dialog = inject(MatDialog);
  private _httpClient = inject(ApiClient);
  private _route = inject(ActivatedRoute);
  private _toastr = inject(ToastrService);

  private destroy$ = new Subject<void>();
  orgId!: string;

  // Signals for organization data
  organizationData = signal<any>(null);

  ngOnInit(): void {
    this.orgId = this._route.snapshot.paramMap.get('id')!;
    if (this.orgId) {
      this.getOrganizationDetails();
    }
  }

  // Get Organization Details API Call
  getOrganizationDetails() {
    const payload = {
      "organizationId": this.orgId
    };

    this._httpClient.post(API_ENDPOINTS.organizations.get_org_details, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (_res: any) => {
        if (_res?.data) {
          this.organizationData.set(_res.data);
          console.log('Organization details loaded:', _res.data);
          this._toastr.success('Organization details loaded');
        }
      },
      error: (_err: any) => {
        console.error('Error fetching organization details:', _err);
        this._toastr.error('Failed to load organization details');
      },
      complete: () => {
      }
    });
  }

  openSuspendDialog() {
    const orgData = this.organizationData();
    this.dialog.open(OrganizationStatusDialog, {
      width: '420px',
      data: {
        status: 'suspend', // or 'activate'
        orgName: orgData?.organization?.name || 'Organization'
      }
    });
  }
}

