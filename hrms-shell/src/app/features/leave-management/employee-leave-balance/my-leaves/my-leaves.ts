import { Component, inject, signal } from '@angular/core';
import { MATERIAL } from '../../../../shared/material/materials';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { CommonService } from '../../../../core/services/common.service';
import { MatDialog } from '@angular/material/dialog';
import { ApplyLeaveDialog } from '../../../../shared/dialogs/apply-leave-dialog/apply-leave-dialog';

export interface MyLeaveBalance {
  code: string;
  name: string;
  credited: number;
  used: number;
  available: number;
  color?: string;
}

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface MyLeaveRequest {
  id: string;
  applied_on: Date;
  start_date: Date;
  end_date: Date;
  leave_type: string; // e.g., 'CL', 'SL', 'PL'
  days: number;
  status: LeaveStatus;
  reason?: string;
}

@Component({
  selector: 'app-my-leaves',
  imports: [MATERIAL, CommonModule, FormsModule, PageHeader],
  templateUrl: './my-leaves.html',
  styleUrl: './my-leaves.scss',
})
export class MyLeaves {
  private _commonService = inject(CommonService);
  private _dialog = inject(MatDialog);

  // Logged-in employee
  user = signal<any | null>(null);

  // Summary balances (static for now)
  balances = signal<MyLeaveBalance[]>([
    { code: 'CL', name: 'Casual Leave', credited: 6, used: 2, available: 4, color: '#4caf50' },
    { code: 'PL', name: 'Paid Leave', credited: 10, used: 0, available: 10, color: '#2196f3' },
    { code: 'SL', name: 'Sick Leave', credited: 8, used: 1, available: 7, color: '#ff9800' },
  ]);

  totalCredits = signal<number>(0);
  totalUsed = signal<number>(0);
  totalBalance = signal<number>(0);

  // Requests (static)
  requests = signal<MyLeaveRequest[]>([{
    id: 'REQ-1001', applied_on: new Date('2026-02-01'), start_date: new Date('2026-02-15'), end_date: new Date('2026-02-16'),
    leave_type: 'CL', days: 2, status: 'Pending', reason: 'Family event'
  }, {
    id: 'REQ-1000', applied_on: new Date('2026-01-10'), start_date: new Date('2026-01-18'), end_date: new Date('2026-01-18'),
    leave_type: 'SL', days: 1, status: 'Approved', reason: 'Fever'
  }, {
    id: 'REQ-0999', applied_on: new Date('2025-12-05'), start_date: new Date('2025-12-20'), end_date: new Date('2025-12-22'),
    leave_type: 'PL', days: 3, status: 'Rejected', reason: 'Project deliverable'
  }, {
    id: 'REQ-0998', applied_on: new Date('2025-11-02'), start_date: new Date('2025-11-10'), end_date: new Date('2025-11-10'),
    leave_type: 'CL', days: 1, status: 'Cancelled', reason: 'Changed plan'
  }]);

  // Filters
  statusFilter: 'All' | LeaveStatus = 'All';
  displayedColumns = ['applied_on', 'period', 'leave_type', 'days', 'status', 'actions'];
  dataSource = new MatTableDataSource<MyLeaveRequest>([]);

  async ngOnInit() {
    // Auto-detect logged-in employee (no selector)
    this.user.set(await this._commonService.getUserDetails());
    this.recalculateSummary();
    this.applyFilters();
  }

  recalculateSummary() {
    const credits = this.balances().reduce((acc, b) => acc + b.credited, 0);
    const used = this.balances().reduce((acc, b) => acc + b.used, 0);
    const bal = this.balances().reduce((acc, b) => acc + b.available, 0);
    this.totalCredits.set(credits);
    this.totalUsed.set(used);
    this.totalBalance.set(bal);
  }

  applyFilters() {
    let data = this.requests();
    if (this.statusFilter !== 'All') {
      data = data.filter(r => r.status === this.statusFilter);
    }
    this.dataSource.data = data;
  }

  onStatusChange(value: 'All' | LeaveStatus) {
    this.statusFilter = value;
    this.applyFilters();
  }

  canCancel(row: MyLeaveRequest): boolean {
    return row.status === 'Pending';
  }

  cancel(row: MyLeaveRequest) {
    if (!this.canCancel(row)) return;
    const updated:any = this.requests().map(r => r.id === row.id ? { ...r, status: 'Cancelled' } : r);
    this.requests.set(updated);
    this.applyFilters();
  }

  openApplyLeaveDialog() {
    const user = this.user();
    const dialogRef = this._dialog.open(ApplyLeaveDialog, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: {
        employee_id: user?.employee_uuid || user?.employee_id || '-',
        leaveBalances: this.balances().map(b => ({
          leave_type_id: b.code,
          leave_type_name: b.name,
          leave_type_code: b.code,
          total_credited: b.credited,
          total_debited: b.used,
          available_balance: b.available,
          pending_requests: 0,
          color: b.color
        }))
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      // Static screen: no API call, just toast/refresh when needed
      if (result?.success) {
        this.applyFilters();
      }
    });
  }
}
