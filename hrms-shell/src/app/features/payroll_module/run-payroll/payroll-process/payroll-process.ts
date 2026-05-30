import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, catchError, finalize, forkJoin, of, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { MATERIAL } from '../../../../shared/material/materials';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ApiClient } from '../../../../core/services/api-client.service';
import { API_ENDPOINTS } from '../../../../core/config/api-endpoints';

interface PayrollRunRecord {
  run_id: string;
  month: number;
  year: number;
  payroll_cycle: string;
  status: 'draft' | 'processed' | 'locked' | string;
  total_employees?: number;
  total_gross?: number;
  total_earnings?: number;
  total_deductions?: number;
  total_payout_amount?: number;
  warnings?: string[];
  recalculation_count?: number;
}

interface PayrollBreakupItem {
  name: string;
  amount: number;
}

interface PayrollEmployeeRecord {
  employee_id: string;
  employee_name: string;
  department: string;
  template_name: string;
  earnings: PayrollBreakupItem[];
  deductions: PayrollBreakupItem[];
  reimbursements: PayrollBreakupItem[];
  reimbursement_total: number;
  loan_emi: number;
  other_deduction: number;
  gross: number;
  total_earnings: number;
  lop_days: number;
  net_pay: number;
  total_deductions: number;
  working_days: number;
  payable_days: number;
  status: string;
}

interface PayrollValidation {
  key: string;
  label: string;
  message: string;
  level: 'error' | 'warning' | 'alert';
  passed: boolean;
}

interface PayrollAuditEntry {
  action: 'PROCESSED' | 'RECALCULATED' | 'LOCKED';
  actor: string;
  timestamp: string;
  details: string;
}

interface PayrollRunSummary {
  total_employees: number;
  total_gross: number;
  total_earnings: number;
  total_deductions: number;
  total_payout_amount: number;
}

interface RecalculatePayrollResult {
  payroll_run_id: string;
  status: string;
  summary: PayrollRunSummary;
  warnings: string[];
}

@Component({
  selector: 'app-payroll-process',
  imports: [MATERIAL, CommonModule, FormsModule, PageHeader],
  templateUrl: './payroll-process.html',
  styleUrl: './payroll-process.scss',
})
export class PayrollProcess implements OnInit, OnDestroy {
  private _httpClient = inject(ApiClient);
  private _toastr = inject(ToastrService);
  private destroy$ = new Subject<void>();

  // Breadcrumbs and table columns
  breadcrumbs = ['HRMS', 'Payroll', 'Payroll Process'];
  displayedColumns = [
    'expand', 'employee_id', 'employee_name', 'department', 'working_days', 'lop_days', 'gross', 'total_earnings', 'total_deductions', 'net_pay', 'status', 'actions'
  ];
  // State signals
  selectedMonth: string = '';
  selectedRunId: string = '';
  availableMonths: string[] = [];
  payrollCycle: string = 'Monthly';
  validatePreviousLock: boolean = true;
  searchQuery: string = '';
  statusFilter: 'ALL' | 'DRAFT' | 'PROCESSED' | 'LOCKED' | 'ERROR' = 'ALL';
  expandedEmployeeId: string | null = null;

  currentRun: PayrollRunRecord | null = null;
  payrollRuns: PayrollRunRecord[] = [];
  employees: PayrollEmployeeRecord[] = [];
  validationChecks: PayrollValidation[] = [];
  auditTrail: PayrollAuditEntry[] = [];
  recalculationResult: RecalculatePayrollResult | null = null;

  // Filter employees based on search and status
  getFilteredEmployees(): PayrollEmployeeRecord[] {
    const query = this.searchQuery.toLowerCase().trim();
    const status = this.statusFilter;
    return this.employees.filter(emp => {
      const matchesQuery = !query || emp.employee_name.toLowerCase().includes(query) || emp.employee_id.toLowerCase().includes(query) || emp.template_name.toLowerCase().includes(query) || emp.department.toLowerCase().includes(query);
      const empStatus = (emp.status || '').toUpperCase();
      const matchesStatus = status === 'ALL' || empStatus === status;
      return matchesQuery && matchesStatus;
    });
  }

  // Calculate payroll statistics
  getStats(): any[] {
    const summary = this.recalculationResult?.summary;
    if (summary) {
      return [
        { label: 'Employees', value: this.toNumber(summary.total_employees), icon: 'groups', color: '#2563eb', bgColor: '#eff6ff', isCurrency: false },
        { label: 'Gross', value: this.toNumber(summary.total_gross), icon: 'payments', color: '#16a34a', bgColor: '#f0fdf4', isCurrency: true },
        { label: 'Total Earnings', value: this.toNumber(summary.total_earnings), icon: 'account_balance', color: '#0891b2', bgColor: '#ecfeff', isCurrency: true },
        { label: 'Deductions', value: this.toNumber(summary.total_deductions), icon: 'receipt_long', color: '#ea580c', bgColor: '#fff7ed', isCurrency: true },
        { label: 'Net Salary', value: this.toNumber(summary.total_payout_amount), icon: 'account_balance_wallet', color: '#7c3aed', bgColor: '#f5f3ff', isCurrency: true },
      ];
    }

    if (this.currentRun) {
      return [
        { label: 'Employees', value: this.toNumber(this.currentRun.total_employees), icon: 'groups', color: '#2563eb', bgColor: '#eff6ff', isCurrency: false },
        { label: 'Gross', value: this.toNumber(this.currentRun.total_gross), icon: 'payments', color: '#16a34a', bgColor: '#f0fdf4', isCurrency: true },
        { label: 'Total Earnings', value: this.toNumber(this.currentRun.total_earnings), icon: 'account_balance', color: '#0891b2', bgColor: '#ecfeff', isCurrency: true },
        { label: 'Deductions', value: this.toNumber(this.currentRun.total_deductions), icon: 'receipt_long', color: '#ea580c', bgColor: '#fff7ed', isCurrency: true },
        { label: 'Net Salary', value: this.toNumber(this.currentRun.total_payout_amount), icon: 'account_balance_wallet', color: '#7c3aed', bgColor: '#f5f3ff', isCurrency: true },
      ];
    }

    const employees = this.employees;
    return [
      { label: 'Employees', value: employees.length, icon: 'groups', color: '#2563eb', bgColor: '#eff6ff', isCurrency: false },
      { label: 'Gross', value: employees.reduce((sum, emp) => sum + this.toNumber(emp.gross), 0), icon: 'payments', color: '#16a34a', bgColor: '#f0fdf4', isCurrency: true },
      { label: 'Total Earnings', value: employees.reduce((sum, emp) => sum + this.toNumber(emp.total_earnings), 0), icon: 'account_balance', color: '#0891b2', bgColor: '#ecfeff', isCurrency: true },
      { label: 'Deductions', value: employees.reduce((sum, emp) => sum + this.toNumber(emp.total_deductions), 0), icon: 'receipt_long', color: '#ea580c', bgColor: '#fff7ed', isCurrency: true },
      { label: 'Net Salary', value: employees.reduce((sum, emp) => sum + this.toNumber(emp.net_pay), 0), icon: 'account_balance_wallet', color: '#7c3aed', bgColor: '#f5f3ff', isCurrency: true },
    ];
  }

  // Check if any validation errors block processing
  hasBlockingValidation(): boolean {
    return this.validationChecks.some(v => v.level === 'error' && !v.passed);
  }

  // Initialize component
  ngOnInit(): void {
    const now = new Date();
    this.selectedMonth = this.toMonthInput(now);
    this.availableMonths = this.buildMonthOptions(now, 18);
    this.getPayrollRuns();
  }



  // Get current payroll run status
  getRunStatus(): string {
    const status = (this.currentRun?.status || 'draft').toLowerCase();
    if (status === 'approved') return 'processed';
    return status;
  }

  // Get readable month label
  getSelectedMonthLabel(): string {
    const value = this.selectedMonth;
    if (!value || !value.includes('-')) return '--';
    const [y, m] = value.split('-').map(Number);
    if (!y || !m) return '--';
    return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // Get total payout amount
  getTotalPayoutAmount(): number {
    if (this.recalculationResult?.summary) {
      return this.toNumber(this.recalculationResult.summary.total_payout_amount);
    }
    if (this.currentRun) {
      return this.toNumber(this.currentRun.total_payout_amount);
    }
    return this.employees.reduce((sum, emp) => sum + this.toNumber(emp.net_pay), 0);
  }

  // Handle month change
  onMonthChange(value: string): void {
    this.selectedMonth = value;
    this.selectedRunId = '';
    this.currentRun = null;
    this.payrollRuns = [];
    this.employees = [];
    this.recalculationResult = null;
    this.validationChecks = [];
    this.expandedEmployeeId = null;
    this.getPayrollRuns();
  }

  // ==== API CALL FOR TO FETCH PAYROLL RUNS BASED ON MONTH YEAR SELECTION ====
  // ==== PAYROLL RUN LIST ====
  getPayrollRuns(): void {
    const monthYear = this.getMonthYearFromInput();

    const payroll = {
      status: this.statusFilter === 'ALL' ? undefined : this.statusFilter,
      payroll_month: monthYear?.month,
      payroll_year: monthYear?.year,
      page: 1,
      limit: 1000
    }
    this._httpClient.post(API_ENDPOINTS.payroll.get_payroll_runs, payroll).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        const rows = response?.data?.runs || [];
        const mappedRuns: PayrollRunRecord[] = rows.map((run: any) => ({
          run_id: run?._id || '',
          month: this.toNumber(run?.payroll_month),
          year: this.toNumber(run?.payroll_year),
          payroll_cycle: run?.payroll_cycle || this.payrollCycle,
          status: this.normalizeStatus(run?.status || 'draft'),
          total_employees: this.toNumber(run?.total_employees),
          total_gross: this.toNumber(run?.total_gross),
          total_earnings: this.toNumber(run?.total_earnings),
          total_deductions: this.toNumber(run?.total_deductions),
          total_payout_amount: this.toNumber(run?.total_payout_amount),
          warnings: Array.isArray(run?.warnings) ? run.warnings : [],
          recalculation_count: this.toNumber(run?.recalculation_count),
        }));

        this.payrollRuns = mappedRuns;
        if (!mappedRuns.length) {
          this.selectedRunId = '';
          this.currentRun = null;
          this.employees = [];
          return;
        }

        const selected = this.selectedRunId && mappedRuns.some((x) => x.run_id === this.selectedRunId)
          ? this.selectedRunId
          : mappedRuns[0].run_id;
        this.onRunChange(selected);
      },
      error: (error) => {
        this._toastr.error(error?.error?.msg || 'Failed to load payroll runs', 'Error');
      },
    });
  }

  onRunChange(runId: string): void {
    this.selectedRunId = runId || '';
    this.currentRun = this.payrollRuns.find((run) => run.run_id === this.selectedRunId) || null;
    this.recalculationResult = null;
    this.validationChecks = [];
    this.expandedEmployeeId = null;

    if (!this.currentRun?.run_id) {
      this.employees = [];
      return;
    }
    this.fetchPayrollEmployees();
  }


  // ======= API CALL FOR CREATE/PROCESS PAYROLL =======
  createPayrollRun(afterCreate?: () => void): void {
    const monthYear = this.getMonthYearFromInput();
    if (!monthYear) {
      this._toastr.warning('Please select payroll month', 'Validation');
      return;
    }
    const payload = {
      payroll_month: monthYear.month,
      payroll_year: monthYear.year,
      payroll_cycle: this.payrollCycle,
      validate_previous_lock: this.validatePreviousLock,
    }
    this._httpClient.post(API_ENDPOINTS.payroll.create_payroll_run, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        const run = response?.data || response;
        const runId = run?.payroll_run_id || '';
        if (!runId) {
          this._toastr.error('Run id is missing in API response', 'Error');
          return;
        }

        this.currentRun = {
          run_id: runId,
          month: run?.month ?? monthYear.month,
          year: run?.year ?? monthYear.year,
          payroll_cycle: run?.payroll_cycle ?? this.payrollCycle,
          status: this.normalizeStatus(run?.status || 'draft'),
          total_employees: this.toNumber(run?.total_employees),
          total_gross: this.toNumber(run?.total_gross),
          total_earnings: this.toNumber(run?.total_earnings),
          total_deductions: this.toNumber(run?.total_deductions),
          total_payout_amount: this.toNumber(run?.total_payout_amount),
          warnings: Array.isArray(run?.warnings) ? run.warnings : [],
          recalculation_count: this.toNumber(run?.recalculation_count),
        };
        this.selectedRunId = runId;

        this._toastr.success('Payroll run created in Draft', 'Success');
        this.fetchPayrollEmployees(afterCreate);
      },
      error: (error) => {
        this._toastr.error(error?.error?.msg || 'Failed to create payroll run', 'Error');
      },
    });
  }

  // ====== API CALL FOR FETCHING EMPLOYEES IN PAYROLL RUN =======
  fetchPayrollEmployees(afterLoad?: () => void): void {
    const runId = this.currentRun?.run_id;
    if (!runId) {
      this._toastr.warning('Create payroll run first', 'Validation');
      return;
    }
    const payload = {
      payroll_run_id: runId,
      status: this.statusFilter === 'ALL' ? undefined : this.statusFilter,
      search: this.searchQuery || '',
      page: 1,
      limit: 1000
    };
    this._httpClient.post(API_ENDPOINTS.payroll.get_employee_by_runId, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        // Map the API response to the PayrollEmployeeRecord interface
        const rows = response?.data?.employees || [];
        const mapped = rows.map((item: any) => ({
          employee_id: item.employee_code || item.employee_id || item._id || '',
          employee_name: item.employee_name || '',
          department: item.department_id || '', // You may want to map department name if available
          template_name: item.template_id || '', // You may want to map template name if available
          earnings: (item.earnings || []).map((e: any) => ({ name: e.component_name, amount: e.amount })),
          deductions: (item.deductions || []).map((d: any) => ({ name: d.component_name, amount: d.amount })),
          reimbursements: [], // Not present in response, set as empty
          reimbursement_total: 0, // Not present in response, set as 0
          loan_emi: item.loan_deductions || 0,
          other_deduction: item.other_deductions || 0,
          gross: item.gross || 0,
          total_earnings: item.total_earnings || 0,
          lop_days: item.lop_days || 0,
          net_pay: item.net_pay || 0,
          total_deductions: item.total_deductions || 0,
          working_days: item.working_days || 0,
          payable_days: item.working_days || 0, // Not present, fallback to working_days
          status: (item.status || 'DRAFT').toUpperCase(),
        }));
        this.employees = mapped;
        this.validationChecks = this.buildValidationChecks(mapped);
        if (afterLoad) {
          afterLoad();
        }
      },
      error: (error) => {
        this._toastr.error(error?.error?.msg || 'Failed to load payroll employees', 'Error');
      },
    });
  }


  // === API CALL FOR RECALCULATE EMPLOYEE PAYROLL ===
  recalculateEmployee(row: PayrollEmployeeRecord): void {
    const runId = this.currentRun?.run_id;
    if (!runId || !row?.employee_id) {
      return;
    }
    if (this.getRunStatus() === 'locked') {
      this._toastr.warning('Recalculation is not allowed after lock', 'Validation');
      return;
    }
    const payload = {
      employee_id: row.employee_id,
      include_attendance: true,
      include_leave: true,
      include_statutory: true,
      include_overtime: true,
      trigger: 'manual',
      payroll_run_id: runId,
    };
    this._httpClient.post(API_ENDPOINTS.payroll.recalculate_payroll, payload).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this._toastr.success(`Recalculated ${row.employee_name}`, 'Success');
          this.addAudit('RECALCULATED', `Employee ${row.employee_name} (${row.employee_id}) recalculated`);
          this.fetchPayrollEmployees();
        },
        error: (error) => {
          this._toastr.error(error?.error?.msg || 'Failed to recalculate employee', 'Error');
        },
      });
  }

  // === API CALL FOR PROCESS PAYROLL ===
  processPayroll(): void {
    const monthYear = this.getMonthYearFromInput();
    if (!monthYear) {
      this._toastr.warning('Please select payroll month', 'Validation');
      return;
    }

    const selectedIsRunMonth = this.currentRun && this.currentRun.month === monthYear.month && this.currentRun.year === monthYear.year && !!this.currentRun.run_id;

    if (selectedIsRunMonth) {
      this.fetchPayrollEmployees(() => this.markRunProcessed());
      return;
    }

    this.createPayrollRun(() => this.markRunProcessed());
  }

  // === API CALL FOR RECALCULATE ENTIRE PAYROLL ===
  recalculatePayroll(): void {
    const runId = this.currentRun?.run_id;
    if (!runId) {
      this._toastr.warning('Create payroll run first', 'Validation');
      return;
    }
    if (this.getRunStatus() === 'locked') {
      this._toastr.warning('Recalculate is allowed only before lock', 'Validation');
      return;
    }

    const rows = this.getFilteredEmployees();
    if (rows.length === 0) {
      this._toastr.warning('No employees available to recalculate', 'Validation');
      return;
    }

    const payload: any = {
      payroll_run_id: runId,
    }
    this._httpClient.post(API_ENDPOINTS.payroll.recalculate_payroll, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        const data = response?.data || {};
        const summary = data?.summary || {};
        this.recalculationResult = {
          payroll_run_id: data?.payroll_run_id || runId,
          status: this.normalizeStatus(data?.status || this.currentRun?.status || 'draft').toUpperCase(),
          summary: {
            total_employees: this.toNumber(summary?.total_employees),
            total_gross: this.toNumber(summary?.total_gross),
            total_earnings: this.toNumber(summary?.total_earnings),
            total_deductions: this.toNumber(summary?.total_deductions),
            total_payout_amount: this.toNumber(summary?.total_payout_amount),
          },
          warnings: Array.isArray(data?.warnings) ? data.warnings : [],
        };

        if (this.currentRun) {
          this.currentRun.run_id = this.recalculationResult.payroll_run_id;
          this.currentRun.status = this.normalizeStatus(this.recalculationResult.status);
          this.currentRun.total_employees = this.recalculationResult.summary.total_employees;
          this.currentRun.total_gross = this.recalculationResult.summary.total_gross;
          this.currentRun.total_earnings = this.recalculationResult.summary.total_earnings;
          this.currentRun.total_deductions = this.recalculationResult.summary.total_deductions;
          this.currentRun.total_payout_amount = this.recalculationResult.summary.total_payout_amount;
          this.currentRun.warnings = this.recalculationResult.warnings;
        }

        this.addAudit('RECALCULATED', `Payroll recalculated for ${this.recalculationResult.summary.total_employees} employee(s)`);
        this._toastr.success(response?.msg || 'Payroll recalculated successfully', 'Success');
        this.fetchPayrollEmployees();
      },
      error: (error) => {
        this._toastr.error(error?.error?.msg || 'Failed to load payroll employees for recalculation', 'Error');
      },
    });
    // const requests = rows.map((row: PayrollEmployeeRecord) => {
    //   payload.employee_id = row.employee_id;
    //   return this._httpClient.post(API_ENDPOINTS.payroll.recalculate_employee(runId, payload.employee_id), payload).pipe(catchError(() => of(null)));
    // });

    // forkJoin(requests)
    //   .pipe(
    //     finalize(() => {
    //     }),
    //     takeUntil(this.destroy$)
    //   )
    //   .subscribe(() => {
    //     this.addAudit('RECALCULATED', `Payroll recalculated for ${rows.length} employee(s)`);
    //     this._toastr.success('Payroll recalculated successfully', 'Success');
    //     this.fetchPayrollEmployees();
    //   });
  }

  // === API CALL FOR LOCK PAYROLL ===
  lockPayroll(): void {
    const runId = this.currentRun?.run_id;
    if (!runId || this.getRunStatus() !== 'processed') {
      return;
    }

    const confirmed = window.confirm('Lock payroll for this month? This action is irreversible.');
    if (!confirmed) {
      return;
    }

    const payload = {
      payroll_run_id: runId,
      confirm_lock: true,
    };
    this._httpClient.post(API_ENDPOINTS.payroll.lock_payroll, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        if (this.currentRun) {
          this.currentRun.status = 'locked';
        }
        this.employees = this.employees.map((row) => ({ ...row, status: 'LOCKED' }));
        this.addAudit('LOCKED', 'Payroll locked and frozen for editing');
        this._toastr.success('Payroll locked successfully', 'Success');
      },
      error: (error) => {
        this._toastr.error(error?.error?.msg || 'Failed to lock payroll', 'Error');
      },
    });
  }

  // ====== API CALL FOR APPROVE/PROCESS PAYROLL =======
  private markRunProcessed(): void {
    const runId = this.currentRun?.run_id;
    if (!runId) {
      return;
    }
    if (this.hasBlockingValidation()) {
      this._toastr.error('Payroll process blocked. Resolve validation errors first.', 'Validation');
      return;
    }

    const payload = {
      payroll_run_id: runId,
    };
    this._httpClient.post(API_ENDPOINTS.payroll.mark_payroll_processed, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        if (this.currentRun) {
          this.currentRun.status = 'processed';
        }
        this.employees = this.employees.map((row) => ({
          ...row,
          status: row.status === 'ERROR' ? row.status : 'PROCESSED',
        }));
        this.addAudit('PROCESSED', `Payroll processed for ${this.employees.length} employee(s)`);
        this._toastr.success('Payroll processed successfully', 'Success');
      },
      error: (error) => {
        this._toastr.error(error?.error?.msg || 'Failed to process payroll', 'Error');
      },
    });
  }

  // mapEmployeeRecord(item: any): PayrollEmployeeRecord {
  //   const employeeName =
  //     item?.employee_name ||
  //     `${item?.employee?.first_name || ''} ${item?.employee?.last_name || ''}`.trim() ||
  //     'Unknown';
  //   const department = item?.department_name || item?.department?.name || item?.employee?.department?.name || '--';
  //   const gross = this.toNumber(item?.gross ?? item?.gross_salary ?? item?.total_earnings);
  //   const lopDays = this.toNumber(item?.lop_days ?? item?.attendance?.lop_days);
  //   const workingDays = this.toNumber(item?.working_days ?? item?.attendance?.working_days);
  //   const reimbursements = this.mapBreakupItems(item?.reimbursements, 'Reimbursement');
  //   const deductions = this.mapBreakupItems(item?.deductions, 'Deduction');
  //   const earnings = this.mapBreakupItems(item?.earnings, 'Earning');
  //   const totalDeductions = this.toNumber(item?.total_deduction ?? item?.deductions_total);
  //   const reimbursementTotal = this.sumBreakup(reimbursements);
  //   const totalEarnings = this.toNumber(item?.total_earnings ?? gross - ((gross / Math.max(workingDays, 1)) * lopDays) + reimbursementTotal);
  //   const netPay = this.toNumber(item?.net_pay ?? item?.net_preview ?? item?.net_salary ?? totalEarnings - totalDeductions);
  //   const loanEmi = this.toNumber(item?.loan_emi ?? item?.loan?.emi_amount);

  //   return {
  //     employee_id: item?.employee_id || item?._id || '',
  //     employee_name: employeeName,
  //     department,
  //     template_name: item?.template_name || item?.template?.name || '--',
  //     earnings,
  //     deductions,
  //     reimbursements,
  //     reimbursement_total: reimbursementTotal,
  //     loan_emi: loanEmi,
  //     other_deduction: this.toNumber(item?.other_deduction),
  //     gross,
  //     total_earnings: totalEarnings,
  //     lop_days: lopDays,
  //     net_pay: netPay,
  //     total_deductions: totalDeductions,
  //     working_days: workingDays,
  //     payable_days: this.toNumber(item?.payable_days ?? item?.attendance?.payable_days),
  //     status: this.normalizeStatus(item?.status || 'DRAFT').toUpperCase(),
  //   };
  // }


  exportPayroll(): void {
    const rows = this.getFilteredEmployees();
    if (!rows.length) {
      this._toastr.warning('No payroll data available for export', 'Validation');
      return;
    }

    const headers = ['Employee ID', 'Name', 'Department', 'Working Days', 'LOP Days', 'Gross', 'Total Earnings', 'Total Deductions', 'Net Pay', 'Status'];
    const csvRows = rows.map((row: PayrollEmployeeRecord) =>
      [
        row.employee_id,
        row.employee_name,
        row.department,
        row.working_days,
        row.lop_days,
        row.gross.toFixed(2),
        row.total_earnings.toFixed(2),
        row.total_deductions.toFixed(2),
        row.net_pay.toFixed(2),
        row.status,
      ].join(',')
    );

    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `payroll-${this.selectedMonth || 'month'}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }


  // Handle search input
  onSearch(value: string): void {
    this.searchQuery = value || '';
  }

  // Handle status filter change
  onStatusFilter(value: 'ALL' | 'DRAFT' | 'PROCESSED' | 'LOCKED' | 'ERROR'): void {
    this.statusFilter = value;
  }

  // Handle previous lock validation toggle
  onValidatePreviousLockChange(value: boolean): void {
    this.validatePreviousLock = !!value;
  }

  toggleExpand(row: PayrollEmployeeRecord): void {
    this.expandedEmployeeId = this.expandedEmployeeId === row.employee_id ? null : row.employee_id;
  }

  isExpanded(row: PayrollEmployeeRecord): boolean {
    return this.expandedEmployeeId === row.employee_id;
  }



  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(this.toNumber(value));
  }

  getStatusClass(status: string): string {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'locked') return 'locked';
    if (normalized === 'approved' || normalized === 'processed') return 'processed';
    if (normalized === 'draft') return 'draft';
    if (normalized === 'error') return 'error';
    return 'processed';
  }

  getValidationChipClass(level: 'error' | 'warning' | 'alert'): string {
    return level;
  }

  formatRunOption(run: PayrollRunRecord): string {
    const month = String(this.toNumber(run.month)).padStart(2, '0');
    const year = this.toNumber(run.year);
    const status = (run.status || 'draft').toUpperCase();
    return `${month}/${year} | ${status} | ${run.run_id}`;
  }

  private getMonthYearFromInput(): { month: number; year: number } | null {
    const value = this.selectedMonth;
    if (!value || !value.includes('-')) return null;

    const [yearText, monthText] = value.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    if (!year || !month) return null;

    return { month, year };
  }

  private toNumber(value: any): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private buildMonthOptions(from: Date, count: number): string[] {
    const options: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const date = new Date(from.getFullYear(), from.getMonth() - i, 1);
      options.push(this.toMonthInput(date));
    }
    return options;
  }

  private toMonthInput(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${date.getFullYear()}-${month}`;
  }

  private sumBreakup(items: PayrollBreakupItem[]): number {
    return items.reduce((sum, item) => sum + this.toNumber(item.amount), 0);
  }

  private normalizeStatus(status: string): string {
    const value = (status || 'draft').toLowerCase();
    if (value === 'approved') return 'processed';
    return value;
  }

  private mapBreakupItems(data: any, prefix: string): PayrollBreakupItem[] {
    if (!Array.isArray(data)) return [];
    return data.map((item: any, index: number) => ({
      name: item?.name || item?.label || `${prefix} ${index + 1}`,
      amount: this.toNumber(item?.amount ?? item?.value),
    }));
  }

  private buildValidationChecks(rows: PayrollEmployeeRecord[]): PayrollValidation[] {
    const salaryStructureMissing = rows.some((x) => !x.template_name || x.template_name === '--');
    const attendanceNotSynced = rows.some((x) => x.working_days <= 0);
    const pendingReimbursement = rows.some((x) => this.sumBreakup(x.reimbursements) < 0);
    const emiExceedsSalary = rows.some((x) => x.loan_emi > x.total_earnings);

    return [
      {
        key: 'salary-structure',
        label: 'Salary Structure Assignment',
        message: salaryStructureMissing ? 'Some employees are missing salary structure' : 'Salary structures are assigned',
        level: 'error',
        passed: !salaryStructureMissing,
      },
      {
        key: 'attendance-sync',
        label: 'Attendance & Leave Sync',
        message: attendanceNotSynced ? 'Working days are missing for one or more employees' : 'Attendance and leave are synced',
        level: 'warning',
        passed: !attendanceNotSynced,
      },
      {
        key: 'reimbursement',
        label: 'Reimbursements Approval',
        message: pendingReimbursement ? 'Pending reimbursement approvals detected' : 'Approved reimbursements are ready',
        level: 'alert',
        passed: !pendingReimbursement,
      },
      {
        key: 'loan-emi',
        label: 'Loan EMI Validation',
        message: emiExceedsSalary ? 'Loan EMI exceeds salary for one or more employees' : 'Loan deductions are within salary',
        level: 'error',
        passed: !emiExceedsSalary,
      },
    ];
  }

  private addAudit(action: PayrollAuditEntry['action'], details: string): void {
    const entry: PayrollAuditEntry = {
      action,
      details,
      actor: 'Current User',
      timestamp: new Date().toISOString(),
    };
    this.auditTrail = [entry, ...this.auditTrail].slice(0, 15);
  }


  // Can process payroll if run exists and is draft
  get canProcess(): boolean {
    return !!this.currentRun?.run_id && this.getRunStatus() === 'draft';
  }

  // Can recalculate payroll if run exists and not locked
  get canRecalculate(): boolean {
    return !!this.currentRun?.run_id && this.getRunStatus() !== 'locked';
  }

  // Can lock payroll if run exists and is processed
  get canLock(): boolean {
    return !!this.currentRun?.run_id && this.getRunStatus() === 'processed';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
