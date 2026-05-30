import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { MATERIAL } from '../../../../shared/material/materials';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ApiClient } from '../../../../core/services/api-client.service';
import { API_ENDPOINTS } from '../../../../core/config/api-endpoints';
import { ToastrService } from 'ngx-toastr';
import { AssignSalaryDialog, AssignSalaryDialogData } from '../../../../shared/dialogs/assign-salary-dialog/assign-salary-dialog';

// ─── Interfaces ─────────────────────────────────────

export interface EmployeeAssignmentRecord {
  _id?: string;
  employee_id: string;
  employee_name?: string;
  employee_code?: string;
  department?: string;
  designation?: string;
  template_id: string | null;
  template_name?: string;
  template_code?: string;
  annual_ctc: number;
  monthly_gross: number;
  effective_from: string | Date;
  status: 'ACTIVE' | 'REVISED' | 'INACTIVE';
  version: number;
  is_active: boolean;
  earnings_snapshot: EarningSnapshot[];
  deductions_snapshot: DeductionSnapshot[];
  created_at?: string;
  updated_at?: string;
  monthly_ctc?: number;
  employee_email?: string;
}

interface AssignmentApiRecord {
  _id?: string;
  employee_id?: string;
  template_id?: string | null;
  annual_ctc?: number;
  monthly_gross?: number;
  effective_from?: string | Date;
  status?: 'ACTIVE' | 'REVISED' | 'INACTIVE';
  version?: number;
  is_active?: boolean;
  earnings_snapshot?: EarningSnapshot[];
  deductions_snapshot?: DeductionSnapshot[];
  createdAt?: string;
  updatedAt?: string;
  employee_name?: string;
  employee_code?: string;
  employee_email?: string;
  template_name?: string;
  template_code?: string;
  Employee_details?: {
    personal_details?: {
      firstName?: string;
      lastName?: string;
      email?: string;
    };
    job_details?: {
      employee_id?: string;
    };
  };
  template_details?: {
    template_name?: string;
    template_code?: string;
  };
}

export interface EarningSnapshot {
  component_id: string;
  component_code: string;
  component_name: string;
  value_type: 'fixed' | 'percentage' | 'formula';
  fixed_amount?: number | null;
  percentage?: number | null;
  formula?: string | null;
  monthly_value: number;
  annual_value: number;
  override_allowed: boolean;
}

export interface DeductionSnapshot {
  component_id: string;
  component_code: string;
  component_name?: string;
  calculation_type?: string;
  percentage?: number | null;
  fixed_amount?: number | null;
  employer_contribution?: number;
  employee_contribution?: number;
  monthly_value: number;
  value_type: 'fixed' | 'percentage' | 'formula';
  annual_value?: number;
  
}

@Component({
  selector: 'app-employee-assignment',
  imports: [MATERIAL, CommonModule, FormsModule, PageHeader],
  templateUrl: './employee-assignment.html',
  styleUrl: './employee-assignment.scss',
})
export class EmployeeAssignment implements OnInit, OnDestroy {
  private _httpClient = inject(ApiClient);
  private _toastr = inject(ToastrService);
  private _dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  // Page config
  breadcrumbs = ['HRMS', 'Payroll', 'Salary Structure', 'Employee Assignment'];

  // Search & Filter
  searchQuery = signal('');
  statusFilter = signal<'ALL' | 'ASSIGNED' | 'NOT_ASSIGNED'>('ALL');

  // Data
  allAssignments = signal<EmployeeAssignmentRecord[]>([]);
  loading = signal(false);

  // Filtered data
  filteredAssignments = computed(() => {
    let items = this.allAssignments();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      items = items.filter(a =>
        (a.employee_name || '').toLowerCase().includes(q) ||
        (a.employee_code || '').toLowerCase().includes(q) ||
        (a.department || '').toLowerCase().includes(q) ||
        (a.template_name || '').toLowerCase().includes(q)
      );
    }
    const status = this.statusFilter();
    if (status === 'ASSIGNED') {
      items = items.filter(a => a.is_active && a.template_id);
    } else if (status === 'NOT_ASSIGNED') {
      items = items.filter(a => !a.template_id);
    }
    return items;
  });

  // Stats
  stats = computed(() => {
    const all = this.allAssignments();
    const assigned = all.filter(a => a.is_active && a.template_id).length;
    const notAssigned = all.filter(a => !a.template_id).length;
    const revised = all.filter(a => a.status === 'REVISED' || a.version > 1).length;
    return [
      { label: 'Total Employees', value: all.length, icon: 'people', color: '#2563eb', bgColor: '#eff6ff' },
      { label: 'Assigned', value: assigned, icon: 'assignment_turned_in', color: '#16a34a', bgColor: '#f0fdf4' },
      { label: 'Not Assigned', value: notAssigned, icon: 'assignment_late', color: '#ea580c', bgColor: '#fff7ed' },
      { label: 'Revised', value: revised, icon: 'history', color: '#9333ea', bgColor: '#faf5ff' },
    ];
  });

  // Table columns
  displayedColumns = [
    'employee_name', 'employee_email', 'employee_code', 'earnings', 'deductions',
    'template_name', 'monthly_ctc', 'effective_from', 'status', 'actions'
  ];

  // Expanded row for salary history
  expandedRow = signal<string | null>(null);
  salaryHistory = signal<EmployeeAssignmentRecord[]>([]);
  historyLoading = signal(false);

  ngOnInit(): void {
    this.loadAssignments();
  }

  private mapAssignment(apiItem: AssignmentApiRecord): EmployeeAssignmentRecord {
    const firstName = apiItem?.Employee_details?.personal_details?.firstName || '';
    const lastName = apiItem?.Employee_details?.personal_details?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();

    return {
      _id: apiItem?._id,
      employee_id: apiItem?.employee_id || '',
      employee_name: apiItem?.employee_name || fullName || 'Unknown',
      employee_email: apiItem?.employee_email || apiItem?.Employee_details?.personal_details?.email || '--',
      employee_code: apiItem?.employee_code || apiItem?.Employee_details?.job_details?.employee_id || '--',
      department: '',
      designation: '',
      template_id: apiItem?.template_id || null,
      template_name: apiItem?.template_id ? (apiItem?.template_name || apiItem?.template_details?.template_name || '') : '',
      template_code: apiItem?.template_id ? (apiItem?.template_code || apiItem?.template_details?.template_code || '') : '',
      annual_ctc: apiItem?.annual_ctc || 0,
      monthly_gross: apiItem?.monthly_gross || 0,
      monthly_ctc: apiItem?.monthly_gross || 0,
      effective_from: apiItem?.effective_from ? new Date(apiItem.effective_from) : '',
      status: apiItem?.is_active ? (apiItem?.status || 'ACTIVE') : 'INACTIVE',
      version: apiItem?.version || 1,
      is_active: !!apiItem?.is_active,
      earnings_snapshot: apiItem?.earnings_snapshot ?? [],
      deductions_snapshot: apiItem?.deductions_snapshot ?? [],
      created_at: apiItem?.createdAt,
      updated_at: apiItem?.updatedAt,
    };
  }

  // ─── Load All Assignments ───
  loadAssignments(): void {
    this.loading.set(true);
    const backendStatus = this.statusFilter() === 'ASSIGNED' ? 'ACTIVE' : null;
    const payload = {
      status: backendStatus,
      search: this.searchQuery() || null,
      page: 1,
      limit: 200,
    };
    this._httpClient.post(API_ENDPOINTS.payroll.get_assignments, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        const data = response?.data?.assignments || response?.data || [];
        const mappedData = data.map((a: AssignmentApiRecord) => this.mapAssignment(a));
        this.allAssignments.set(mappedData);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading assignments:', error);
        this.loading.set(false);
      }
    });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  onStatusFilter(status: 'ALL' | 'ASSIGNED' | 'NOT_ASSIGNED'): void {
    this.statusFilter.set(status);
  }

  // ─── Assign Salary Dialog ───
  openAssignDialog(): void {
    const dialogData: AssignSalaryDialogData = { mode: 'create' };
    const dialogRef = this._dialog.open(AssignSalaryDialog, {
      width: '960px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'assign-salary-dialog-panel',
      disableClose: true,
      data: dialogData,
    });

    dialogRef.componentInstance.saveRequested
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: any) => {
        if (result?.data) {
          this._httpClient.post(API_ENDPOINTS.payroll.assign_salary, result.data)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                dialogRef.close();
                this._toastr.success('Salary assigned successfully', 'Success');
                this.loadAssignments();
              },
              error: (error) => {
                console.error('Error assigning salary:', error);
                dialogRef.componentInstance.loading.set(false);
                this._toastr.error(error?.error?.msg || 'Failed to assign salary', 'Error');
              }
            });
        }
      });
  }

  // ─── Edit Assignment Dialog ───
  openEditDialog(assignment: EmployeeAssignmentRecord): void {
    const dialogData: AssignSalaryDialogData = { mode: 'edit', assignment };
    const dialogRef = this._dialog.open(AssignSalaryDialog, {
      width: '960px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'assign-salary-dialog-panel',
      disableClose: true,
      data: dialogData,
    });

    dialogRef.componentInstance.saveRequested.pipe(takeUntil(this.destroy$)).subscribe((result: any) => {
        if (result?.data) {
          this._httpClient.post(API_ENDPOINTS.payroll.assign_salary, result.data)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                dialogRef.close();
                this._toastr.success('Salary updated successfully', 'Success');
                this.loadAssignments();
              },
              error: (error) => {
                console.error('Error updating salary:', error);
                dialogRef.componentInstance.loading.set(false);
                this._toastr.error(error?.error?.msg || 'Failed to update salary', 'Error');
              }
            });
        }
      });
  }

  // ─── Revise Salary Dialog ───
  openReviseDialog(assignment: EmployeeAssignmentRecord): void {
    const dialogData: AssignSalaryDialogData = { mode: 'revise', assignment };
    const dialogRef = this._dialog.open(AssignSalaryDialog, {
      width: '960px',
      maxWidth: '95vw',
      maxHeight: '100vh',
      panelClass: 'assign-salary-dialog-panel',
      disableClose: true,
      data: dialogData,
    });

    dialogRef.componentInstance.saveRequested.pipe(takeUntil(this.destroy$)).subscribe((result: any) => {
      if (result?.data) {
        const payload = {
          ...result.data,
          employee_id: assignment.employee_id,
        };
        this._httpClient.post(API_ENDPOINTS.payroll.revise_salary, payload)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              dialogRef.close();
              this._toastr.success('Salary revised successfully. New version created.', 'Success');
              this.loadAssignments();
            },
            error: (error) => {
              console.error('Error revising salary:', error);
              dialogRef.componentInstance.loading.set(false);
              this._toastr.error(error?.error?.msg || 'Failed to revise salary', 'Error');
            }
          });
      }
    });
  }

  // ─── View Salary Details Dialog ───
  openViewDialog(assignment: EmployeeAssignmentRecord): void {
    const dialogData: AssignSalaryDialogData = { mode: 'view', assignment };
    this._dialog.open(AssignSalaryDialog, {
      width: '960px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'assign-salary-dialog-panel',
      data: dialogData,
    });
  }

  // ─── Toggle Salary History Row ───
  toggleHistory(assignment: EmployeeAssignmentRecord): void {
    const empId = assignment.employee_id;
    if (this.expandedRow() === empId) {
      this.expandedRow.set(null);
      this.salaryHistory.set([]);
      return;
    }

    this.expandedRow.set(empId);
    this.historyLoading.set(true);

    const localHistory = this.allAssignments()
      .filter(item => item.employee_id === empId)
      .sort((a, b) => (b.version || 0) - (a.version || 0));

    this.salaryHistory.set(localHistory.length ? localHistory : [assignment]);
    this.historyLoading.set(false);
  }

  // ─── Deactivate Assignment ───
  deactivateAssignment(assignment: EmployeeAssignmentRecord): void {
    if (!confirm(`Are you sure you want to deactivate salary for "${assignment.employee_name}"?`)) {
      return;
    }
    const payload = {
      assignment_id: assignment._id,
      employee_id: assignment.employee_id,
    };
    this._httpClient.post(API_ENDPOINTS.payroll.deactivate_assignment, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this._toastr.success('Salary assignment deactivated', 'Success');
          this.loadAssignments();
        },
        error: (error) => {
          console.error('Error deactivating assignment:', error);
          this._toastr.error('Failed to deactivate assignment', 'Error');
        }
      });
  }

  formatCurrency(val: number | undefined): string {
    if (!val && val !== 0) return '--';
    return '\u20B9' + val.toLocaleString('en-IN');
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'active';
      case 'REVISED': return 'revised';
      case 'INACTIVE': return 'inactive';
      default: return '';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
