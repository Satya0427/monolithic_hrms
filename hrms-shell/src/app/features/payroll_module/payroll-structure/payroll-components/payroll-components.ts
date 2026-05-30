import { Component, inject, OnInit, OnDestroy, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { identity, Subject, takeUntil } from 'rxjs';
import { MATERIAL } from '../../../../shared/material/materials';
import { PageHeader, HeaderTab } from '../../../../shared/components/page-header/page-header';
import {
  SalaryComponent, EarningComponent, DeductionComponent,
  ReimbursementComponent, VariablePayComponent,
  ComponentType, PAYROLL_TABS, PayrollComponentTab, StatCard
} from '../../../../core/models/payroll.models';
import { SalaryComponentDialog, SalaryComponentDialogData } from '../../../../shared/dialogs/salary-component-dialog/salary-component-dialog';
import { PayrollComponentService } from '../../services/payroll-component.service';
import { ApiClient } from '../../../../core/services/api-client.service';
import { API_ENDPOINTS } from '../../../../core/config/api-endpoints';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-payroll-components',
  standalone: true,
  imports: [MATERIAL, CommonModule, FormsModule, PageHeader],
  templateUrl: './payroll-components.html',
  styleUrl: './payroll-components.scss',
})
export class PayrollComponents implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private payrollService = inject(PayrollComponentService);
  private destroy$ = new Subject<void>();
  private _httpClient = inject(ApiClient);
  private _toastr = inject(ToastrService);

  // ─── Page Header Config ─────────────────────────────────────
  breadcrumbs = ['HRMS', 'Payroll', 'Salary Structure', 'Components'];
  headerTabs: HeaderTab[] = PAYROLL_TABS.map(t => ({ label: t.label, key: t.key }));
  activeTabKey = signal<string>('EARNINGS');

  // ─── Tab Config ─────────────────────────────────────────────
  payrollTabs = PAYROLL_TABS;
  activeTab = computed(() => this.payrollTabs.find(t => t.key === this.activeTabKey()) ?? this.payrollTabs[0]);

  // ─── Search & Filter ────────────────────────────────────────
  searchQuery = signal('');
  statusFilter = signal<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // ─── Data ───────────────────────────────────────────────────
  allComponents = signal<SalaryComponent[]>([]);
  filteredComponents = computed(() => {
    let items = this.allComponents().filter(c => c.component_type === this.activeTabKey());
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      items = items.filter(c =>
        c.component_name.toLowerCase().includes(q) ||
        c.component_code.toLowerCase().includes(q)
      );
    }
    const status = this.statusFilter();
    if (status !== 'ALL') {
      items = items.filter(c => c.status === status);
    }
    return items;
  });

  // ─── Table Config ───────────────────────────────────────────
  earningColumns = ['component_name', 'component_code', 'component_category', 'calculation_type', 'taxable', 'pf_applicable', 'show_in_payslip', 'status', 'actions'];
  deductionColumns = ['component_name', 'component_code', 'deduction_nature', 'calculation_type', 'employer_contribution', 'employee_contribution', 'max_cap', 'status', 'actions'];
  reimbursementColumns = ['component_name', 'component_code', 'calculation_type', 'claim_based', 'approval_required', 'max_limit_per_month', 'show_in_payslip', 'status', 'actions'];
  variablePayColumns = ['component_name', 'component_code', 'pay_frequency', 'linked_to_kpi', 'auto_calculate', 'manual_override', 'status', 'actions'];

  displayedColumns = computed(() => {
    switch (this.activeTabKey()) {
      case 'EARNINGS': return this.earningColumns;
      case 'DEDUCTIONS': return this.deductionColumns;
      case 'REIMBURSEMENTS': return this.reimbursementColumns;
      case 'VARIABLE_PAY': return this.variablePayColumns;
      default: return this.earningColumns;
    }
  });

  // ─── Stats ──────────────────────────────────────────────────
  stats = computed<StatCard[]>(() => {
    const tabItems = this.allComponents().filter(c => c.component_type === this.activeTabKey());
    const active = tabItems.filter(c => c.status === 'ACTIVE').length;
    const taxable = tabItems.filter(c => c.taxable).length;
    const pfApplicable = tabItems.filter(c => c.pf_applicable).length;
    return [
      { label: 'Total Components', value: tabItems.length, icon: 'inventory_2', color: '#2563eb', bgColor: '#eff6ff' },
      { label: 'Active', value: active, icon: 'check_circle', color: '#16a34a', bgColor: '#f0fdf4' },
      { label: 'Taxable', value: taxable, icon: 'receipt', color: '#ea580c', bgColor: '#fff7ed' },
      { label: 'PF Applicable', value: pfApplicable, icon: 'savings', color: '#9333ea', bgColor: '#faf5ff' },
    ];
  });

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    this.loadComponents();
  }

  onTabChange(tabKey: string | number | null): void {
    if (tabKey) {
      this.activeTabKey.set(tabKey as string);
      this.loadComponents();
    }
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  onStatusFilter(status: 'ALL' | 'ACTIVE' | 'INACTIVE'): void {
    this.statusFilter.set(status);
  }

  // ─── Load Components from API ───────────────────────────────
  loadComponents() {
    const payload = {
      component_type: this.activeTabKey() || null,
      status: this.statusFilter() === 'ALL' ? 'ALL' : this.statusFilter(),
      search: this.searchQuery() || null,
      page: 1,
      limit: 100,
    };
    this._httpClient.post(API_ENDPOINTS.payroll.get_components, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response?.data?.components) {
          const components = response.data.components as SalaryComponent[];
          this.allComponents.set(components);
        } else {
          console.warn('API returned no components data');
        }
      },
      error: (error) => {
        console.error('API error:', error);
      }
    });
  }

  // ─── Dialog Actions ─────────────────────────────────────────
  openAddDialog(): void {
    const dialogData: SalaryComponentDialogData = {
      mode: 'create',
      componentType: this.activeTabKey() as ComponentType,
    };
    const dialogRef = this.dialog.open(SalaryComponentDialog, {
      width: '760px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'dynamic-dialog-panel',
      disableClose: true,
      data: dialogData,
    });
    dialogRef.componentInstance.saveRequested.pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result?.data) {
        this._httpClient.post(API_ENDPOINTS.payroll.create_component, result.data).pipe(takeUntil(this.destroy$)).subscribe({
          next: (response: any) => {
            dialogRef.close();
            this.loadComponents();
            this._toastr.success('Component created successfully', 'Success');
          },
          error: (error) => {
            console.error('API create error:', error);
            dialogRef.componentInstance.loading.set(false);
            this._toastr.error('Failed to create component', 'Error');
          }
        });
      }
    });
  }

  openEditDialog(component: SalaryComponent): void {
    const dialogData: SalaryComponentDialogData = {
      mode: 'edit',
      componentType: component.component_type,
      component,
    };
    const dialogRef = this.dialog.open(SalaryComponentDialog, {
      width: '760px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'dynamic-dialog-panel',
      disableClose: true,
      data: dialogData,
    });
    dialogRef.componentInstance.saveRequested.pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result?.data) {
        const payload = { id: component._id, ...result.data };
        this._httpClient.post(API_ENDPOINTS.payroll.update_component, payload).pipe(takeUntil(this.destroy$)).subscribe({
          next: (response: any) => {
            dialogRef.close();
            this._toastr.success('Component updated successfully', 'Success');
            this.loadComponents();
          },
          error: (error) => {
            console.error('API update error:', error);
            dialogRef.componentInstance.loading.set(false);
            this._toastr.error('Failed to update component', 'Error');
          }
        });
      }
    });
  }

  openViewDialog(component: SalaryComponent): void {
    const dialogData: SalaryComponentDialogData = {
      mode: 'view',
      componentType: component.component_type,
      component,
    };
    this.dialog.open(SalaryComponentDialog, {
      width: '760px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'dynamic-dialog-panel',
      data: dialogData,
    });
  }

  // API CALL FOR TOGGLE STATUS
  async toggleStatus(component: SalaryComponent): Promise<void> {
    const newStatus = component.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const payload = {
      id: component._id,
      status: newStatus,
    }
    this._httpClient.post(API_ENDPOINTS.payroll.toggle_component_status, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        this._toastr.success(`Component ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`, 'Success');
        this.loadComponents();
      },
      error: (error) => {
        console.error('API toggle error:', error);
      }
    });
  }

  // API CALL FOR DELETE COMPONENT
  async deleteComponent(component: SalaryComponent): Promise<void> {
    if ((component as EarningComponent).is_basic) {
      this._toastr.warning('Cannot delete the Basic component. It is a mandatory system component.');
      return;
    }
    if (component.component_type === 'DEDUCTIONS' && (component as DeductionComponent).deduction_nature === 'statutory') {
      this._toastr.warning('Statutory deductions cannot be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to delete "${component.component_name}"?`)) {
      return;
    }
    const payload = {
      id: component._id,
    }
    this._httpClient.post(API_ENDPOINTS.payroll.delete_component, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        this._toastr.success('Component Deleted successfully');
        this.loadComponents();
      },
      error: (error) => {
        console.error('API delete error:', error);
        this._toastr.error('Failed to delete component');
      }
    });
  }

  getCalculationLabel(type: string): string {
    const labels: Record<string, string> = {
      'fixed': 'Fixed Amount',
      'percentage_of_basic': '% of Basic',
      'formula': 'Formula',
    };
    return labels[type] || type;
  }

  getCategoryLabel(cat: string): string {
    return cat === 'fixed' ? 'Fixed' : 'Variable';
  }

  formatCurrency(val: number | undefined): string {
    if (!val && val !== 0) return '—';
    return '₹' + val.toLocaleString('en-IN');
  }

  private generateId(): string {
    return 'comp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
