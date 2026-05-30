import { Component, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Subject, takeUntil, of, delay } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ApiClient } from '../../../core/services/api-client.service';
import { API_ENDPOINTS } from '../../../core/config/api-endpoints';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { MATERIAL } from '../../../shared/material/materials';

export interface AttendanceRegularizationRequest {
  _id: string;
  employee_name: string;
  employee_email?: string;
  date: string;
  regularization_type: 'MISSED_PUNCH' | 'TIME_CORRECTION';
  check_in_time: string;
  check_out_time: string;
  total_hours: string;
  reason: string;
  status: string;
  applied_at: string;
}

// Dummy data for development/testing
const DUMMY_REQUESTS: AttendanceRegularizationRequest[] = [
  {
    _id: '1',
    employee_name: 'Rahul Sharma',
    employee_email: 'rahul.sharma@company.com',
    date: '02/10/2026',
    regularization_type: 'MISSED_PUNCH',
    check_in_time: '09:15 AM',
    check_out_time: '',
    total_hours: '—',
    reason: 'Forgot to punch out due to urgent client call at end of day.',
    status: 'PENDING',
    applied_at: '2026-02-11T10:30:00Z'
  },
  {
    _id: '2',
    employee_name: 'Priya Patel',
    employee_email: 'priya.patel@company.com',
    date: '02/09/2026',
    regularization_type: 'TIME_CORRECTION',
    check_in_time: '08:45 AM',
    check_out_time: '06:30 PM',
    total_hours: '9h 45m',
    reason: 'Biometric machine was not working. Logged in via laptop but punch was not recorded.',
    status: 'PENDING',
    applied_at: '2026-02-10T09:00:00Z'
  },
  {
    _id: '3',
    employee_name: 'Amit Kumar',
    employee_email: 'amit.kumar@company.com',
    date: '02/08/2026',
    regularization_type: 'MISSED_PUNCH',
    check_in_time: '',
    check_out_time: '05:45 PM',
    total_hours: '—',
    reason: 'Was working from client location and could not access biometric system for check-in.',
    status: 'PENDING',
    applied_at: '2026-02-09T11:15:00Z'
  },
  {
    _id: '4',
    employee_name: 'Sneha Reddy',
    employee_email: 'sneha.reddy@company.com',
    date: '02/07/2026',
    regularization_type: 'TIME_CORRECTION',
    check_in_time: '10:00 AM',
    check_out_time: '07:15 PM',
    total_hours: '9h 15m',
    reason: 'System recorded incorrect check-in time. Actual arrival was at 10:00 AM, system shows 11:30 AM.',
    status: 'PENDING',
    applied_at: '2026-02-08T08:45:00Z'
  },
  {
    _id: '5',
    employee_name: 'Deepak Verma',
    employee_email: 'deepak.verma@company.com',
    date: '02/06/2026',
    regularization_type: 'MISSED_PUNCH',
    check_in_time: '09:30 AM',
    check_out_time: '',
    total_hours: '—',
    reason: 'Power outage in the office prevented biometric punch-out.',
    status: 'PENDING',
    applied_at: '2026-02-07T10:00:00Z'
  }
];

@Component({
  selector: 'app-attendance-regurilization-request',
  imports: [CommonModule, PageHeader, MATERIAL],
  templateUrl: './attendance-regurilization-request.html',
  styleUrl: './attendance-regurilization-request.scss',
})
export class AttendanceRegurilizationRequest {
  private _httpClient = inject(ApiClient);
  private _toastr = inject(ToastrService);
  private _location = inject(Location);

  regularizationRequests = signal<AttendanceRegularizationRequest[]>([]);
  destroy$ = new Subject<void>();

  private useDummyData = true; // Toggle to false when real API is ready

  ngOnInit() {
    this.fetchPendingRequests();
  }

  fetchPendingRequests() {
    if (this.useDummyData) {
      // Dummy API call simulation with delay
      of({ data: { data: DUMMY_REQUESTS } }).pipe(delay(500)).subscribe({
        next: (response: any) => {
          this.mapAndSetRequests(response);
        }
      });
      return;
    }

    // Real API call
    const payload = {};
    this._httpClient.post(API_ENDPOINTS.attendance.request_regularization, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.mapAndSetRequests(response);
        },
        error: () => {
          this._toastr.error('Failed to fetch pending regularization requests');
        }
      });
  }

  private mapAndSetRequests(response: any) {
    const items = response?.data?.data ?? response?.data ?? [];
    const mapped = (items || []).map((r: any) => ({
      _id: r._id,
      employee_name: r.employee_details
        ? `${r.employee_details.first_name || ''} ${r.employee_details.last_name || ''}`.trim()
        : r.employee_name || '',
      employee_email: r.employee_details?.work_email || r.employee_email,
      date: r.date ? new Date(r.date).toLocaleDateString() : r.date || '',
      regularization_type: r.regularization_type || 'MISSED_PUNCH',
      check_in_time: r.check_in_time || '',
      check_out_time: r.check_out_time || '',
      total_hours: r.total_hours || '',
      reason: r.reason || '',
      status: r.status || 'PENDING',
      applied_at: r.applied_at || ''
    }));
    this.regularizationRequests.set(mapped);
  }

  updateRequestStatus(requestId: string, status: 'APPROVED' | 'REJECTED') {
    if (this.useDummyData) {
      // Dummy API call simulation
      of({ success: true }).pipe(delay(300)).subscribe({
        next: () => {
          this._toastr.success(`Regularization request ${status.toLowerCase()} successfully`);
          // Remove from list to simulate update
          this.regularizationRequests.update(requests =>
            requests.filter(r => r._id !== requestId)
          );
        }
      });
      return;
    }

    // Real API call
    const payload = {
      regularization_request_id: requestId,
      status: status,
      remarks: ''
    };
    this._httpClient.post(API_ENDPOINTS.attendance.request_regularization, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this._toastr.success(`Regularization request ${status.toLowerCase()} successfully`);
          this.fetchPendingRequests();
        },
        error: (error) => {
          console.error('Error updating regularization request status:', error);
          this._toastr.error('Failed to update request status');
        }
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
