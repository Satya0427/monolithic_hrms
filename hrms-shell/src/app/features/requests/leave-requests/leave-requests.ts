import { Component, inject, signal } from '@angular/core';
import { ApiClient } from '../../../core/services/api-client.service';
import { ToastrService } from 'ngx-toastr';
import { CommonService } from '../../../core/services/common.service';
import { API_ENDPOINTS } from '../../../core/config/api-endpoints';
import { Subject, take, takeUntil } from 'rxjs';
import { CommonModule, Location } from '@angular/common';
import { PageHeader } from '../../../shared/components/page-header/page-header';


@Component({
  selector: 'app-leave-requests',
  imports: [PageHeader],
  templateUrl: './leave-requests.html',
  styleUrl: './leave-requests.scss',
})
export class LeaveRequests {
  private _httpClient = inject(ApiClient);
  private _toastr = inject(ToastrService);
  private _commonService = inject(CommonService);
  private _location = inject(Location);

  leaveRequests = signal<any[]>([]);
  destroy$ = new Subject<void>();
  currentTab: string | number | null = null;
  pageTabs: any[] = [];
  async ngOnInit() {
    this.pageTabs = await this._commonService.getTabs('LEAVE_BALANCE');
    if (this.pageTabs.length > 0) {
      this.currentTab = this.pageTabs[4]?.key || null; // Leave Balance tab
    }
    this.fetchPendingRequests();
  }


  //  ========= FETCH PENDING LEAVE REQUEST API CALL ===
  fetchPendingRequests() {
    const payload = {

    }
    this._httpClient.post(API_ENDPOINTS.leave.get_pending_requests, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        const items = response?.data?.data ?? response?.data ?? [];
        const mapped = (items || []).map((r: any) => ({
          _id: r._id,
          from_date: r.from_date ? new Date(r.from_date).toLocaleDateString() : '',
          to_date: r.to_date ? new Date(r.to_date).toLocaleDateString() : '',
          total_days: r.total_days,
          half_day: r.half_day,
          reason: r.reason,
          status: r.status,
          applied_at: r.applied_at,
          employee_name: r.employee_details ? `${r.employee_details.first_name || ''} ${r.employee_details.last_name || ''}`.trim() : r.employee_name || '',
          employee_email: r.employee_details?.work_email,
          leave_type: r.leave_type_details?.name || r.leave_type
        }));

        this.leaveRequests.set(mapped);
      },
      error: (error) => {
        this._toastr.error('Failed to fetch pending leave requests');
      }
    });
  }

  // ======== APPROVE/REJECT LEAVE REQUEST API CALL ===
  updateLeaveRequestStatus(requestId: string, status: 'APPROVED' | 'REJECTED') {
    const payload = {
      leave_request_id: requestId,
      status: status,
      remarks: '' // You can add a field for remarks if needed
    };
    this._httpClient.post(API_ENDPOINTS.leave.update_request_status,payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        this._toastr.success(`Leave request ${status.toLowerCase()} successfully`);
        this.fetchPendingRequests();
      },
      error: (error) => {
        console.error('Error updating leave request status:', error);
      }
    });
    // this.http.put(`/api/leave-management-module/${status.toLowerCase()}/${requestId}`, {})
    //   .subscribe(() => {
    //     this.fetchPendingRequests();
    //   });
  }

  rejectLeave(requestId: string) {
    //   this.http.put(`/api/leave-management-module/reject/${requestId}`, {})
    //     .subscribe(() => {
    //       this.fetchPendingRequests();
    //     });
  }


  handleBack() {
    this._location.back();
  }
}
