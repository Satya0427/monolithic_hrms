import { Component, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Subject, takeUntil, of, delay } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { ApiClient } from '../../../core/services/api-client.service';
import { API_ENDPOINTS } from '../../../core/config/api-endpoints';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { MATERIAL } from '../../../shared/material/materials';
import { RemarksDialog } from '../../../shared/dialogs/remarks-dialog/remarks-dialog';

export interface WfhRequest {
  _id: string;
  employee_name: string;
  employee_uuid: string;
  request_date: string;
  request_type: 'FULL_DAY' | 'HALF_DAY' | 'RECURRING';
  reason: string;
  status: string;
  requested_at: string;
}


@Component({
  selector: 'app-work-from-home-requests',
  imports: [CommonModule, PageHeader, MATERIAL],
  templateUrl: './work-from-home-requests.html',
  styleUrl: './work-from-home-requests.scss',
})
export class WorkFromHomeRequests {
  private _httpClient = inject(ApiClient);
  private _toastr = inject(ToastrService);
  private _location = inject(Location);
  private _dialog = inject(MatDialog);

  wfhRequests = signal<WfhRequest[]>([]);
  destroy$ = new Subject<void>();

  statusOptions = [
    { key: 'PENDING', name: 'Pending' },
    { key: 'APPROVED', name: 'Approved' },
    { key: 'REJECTED', name: 'Rejected' },
    { key: 'CANCELLED', name: 'Cancelled' }
  ];
  selectedStatus = signal<string>('PENDING');

  ngOnInit() {
    this.fetchPendingRequests();
  }

  onFilterChange(status: string) {
    this.selectedStatus.set(status);
    this.fetchPendingRequests();
  }

  // ====== Fetch Pending WFH Requests ======
  fetchPendingRequests() {
    const payload = {
      status: this.selectedStatus(),
    };
    this._httpClient.post(API_ENDPOINTS.attendance.get_wfh_requests_list, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        const items = response?.data?.requests ?? response?.data?.data ?? response?.data ?? [];
        const mapped = (items || []).map((r: any) => ({
          _id: r._id,
          employee_name: r.employee_details
            ? `${r.employee_details.first_name || ''} ${r.employee_details.last_name || ''}`.trim()
            : r.employee_name || '',
          employee_uuid: r.employee_uuid || '',
          request_date: r.request_date ? new Date(r.request_date).toLocaleDateString() : '',
          request_type: r.request_type || 'FULL_DAY',
          reason: r.reason || '',
          status: r.status || 'PENDING',
          requested_at: r.requested_at || ''
        }));
        this.wfhRequests.set(mapped);
        // this.mapAndSetRequests(response);
      },
      error: () => {
        this._toastr.error('Failed to fetch pending WFH requests');
      }
    });
  }

  // ==== Update WFH Request Status (Approve/Reject) ======
  updateRequestStatus(requestId: string, status: 'APPROVED' | 'REJECTED') {
    const dialogRef = this._dialog.open(RemarksDialog, {
      width: '420px',
      disableClose: true,
      data: { action: status }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (!result?.confirmed) return;
      const payload = {
        request_id: requestId,
        action: status,
        manager_comment: result.remarks || ''
      };
      this._httpClient.post(API_ENDPOINTS.attendance.update_wfh_request_status, payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this._toastr.success(`WFH request ${status.toLowerCase()} successfully`);
            this.fetchPendingRequests();
          },
          error: (error) => {
            console.error('Error updating WFH request status:', error);
            this._toastr.error('Failed to update request status');
          }
        });
    });
  }

  handleBack() {
    this._location.back();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
