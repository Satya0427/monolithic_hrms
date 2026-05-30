import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MATERIAL } from '../../../../shared/material/materials';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ApiClient } from '../../../../core/services/api-client.service';
import { API_ENDPOINTS } from '../../../../core/config/api-endpoints';
import { ToastrService } from 'ngx-toastr';

export interface PayrollTemplate {
  _id?: string;
  template_name: string;
  template_code: string;
  description?: string;
  effective_from: string | Date;
  status: 'ACTIVE' | 'INACTIVE';
  earnings: TemplateEarning[];
  deductions: TemplateDeduction[];
  ctc_preview?: CtcPreview;
  allow_manual_override: boolean;
  lock_after_assignment: boolean;
  version_control_enabled: boolean;
  used_by_count?: number;
  is_deleted?: boolean;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TemplateEarning {
  component_id: string;
  component_name?: string;
  component_code?: string;
  value_type: 'fixed' | 'percentage' | 'formula';
  fixed_amount?: number;
  percentage?: number;
  formula?: string;
  override_allowed: boolean;
  calculation_order: number;
  is_mandatory: boolean;
  is_basic?: boolean;
  calculation_type?: string;
}

export interface TemplateDeduction {
  component_id: string;
  component_name?: string;
  component_code?: string;
  deduction_nature?: string;
  calculation_type?: string;
  fixed_amount?: number;
  percentage?: number;
  formula?: string;
  override_allowed: boolean;
}

export interface CtcPreview {
  annual_ctc?: number;
  monthly_gross?: number;
  total_annual_earnings?: number;
  total_monthly_earnings?: number;
  total_annual_deductions?: number;
  total_monthly_deductions?: number;
  net_annual_salary?: number;
  net_monthly_salary?: number;
}

@Component({
  selector: 'app-payroll-templates',
  imports: [MATERIAL, CommonModule, FormsModule, PageHeader],
  templateUrl: './payroll-templates.html',
  styleUrl: './payroll-templates.scss',
})
export class PayrollTemplates implements OnInit, OnDestroy {
  private _httpClient = inject(ApiClient);
  private _router = inject(Router);
  private _toastr = inject(ToastrService);
  private destroy$ = new Subject<void>();

  // Page config
  breadcrumbs = ['HRMS', 'Payroll', 'Salary Structure', 'Templates'];

  // Search & Filter
  searchQuery = signal('');
  statusFilter = signal<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Data
  allTemplates = signal<PayrollTemplate[]>([]);

  // Filtered data
  filteredTemplates = computed(() => {
    let items = this.allTemplates();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      items = items.filter(t =>
        t.template_name.toLowerCase().includes(q) ||
        t.template_code.toLowerCase().includes(q)
      );
    }
    const status = this.statusFilter();
    if (status !== 'ALL') {
      items = items.filter(t => t.status === status);
    }
    return items;
  });

  // Stats
  stats = computed(() => {
    const all = this.allTemplates();
    const active = all.filter(t => t.status === 'ACTIVE').length;
    const inactive = all.filter(t => t.status === 'INACTIVE').length;
    const totalAssigned = all.reduce((sum, t) => sum + (t.used_by_count || 0), 0);
    return [
      { label: 'Total Templates', value: all.length, icon: 'description', color: '#2563eb', bgColor: '#eff6ff' },
      { label: 'Active', value: active, icon: 'check_circle', color: '#16a34a', bgColor: '#f0fdf4' },
      { label: 'Inactive', value: inactive, icon: 'cancel', color: '#dc2626', bgColor: '#fef2f2' },
      { label: 'Employees Assigned', value: totalAssigned, icon: 'people', color: '#9333ea', bgColor: '#faf5ff' },
    ];
  });

  // Table columns
  displayedColumns = ['template_name', 'template_code', 'earnings_count', 'deductions_count', 'monthly_ctc', 'status', 'used_by', 'actions'];

  ngOnInit(): void {
    this.loadTemplates();
  }

  // API CALL FOR TO GET TEMPLATES
  loadTemplates(): void {
    const payload = {
      status: this.statusFilter() === 'ALL' ? null : this.statusFilter(),
      search: this.searchQuery() || null,
      page: 1,
      limit: 100,
    };
    this._httpClient.post(API_ENDPOINTS.payroll.get_templates, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response?.data?.templates) {
          this.allTemplates.set(response.data.templates);
        } else if (response?.data && Array.isArray(response.data)) {
          this.allTemplates.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error loading templates:', error);
      }
    });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.loadTemplates();
  }

  onStatusFilter(status: 'ALL' | 'ACTIVE' | 'INACTIVE'): void {
    this.statusFilter.set(status);
    this.loadTemplates();
  }

  navigateToCreate(): void {
    this._router.navigate(['/home/payroll-module/payroll-structure/templates/create']);
  }

  navigateToEdit(template: PayrollTemplate): void {
    this._router.navigate(['/home/payroll-module/payroll-structure/templates/edit', template._id]);
  }

  // API CALL TO DUPLICATE TEMPLATE
  duplicateTemplate(template: PayrollTemplate): void {
    const payload = {
      template_id: template._id,
    };
    this._httpClient.post(API_ENDPOINTS.payroll.duplicate_template, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        this._toastr.success('Template duplicated successfully', 'Success');
        this.loadTemplates();
      },
      error: (error) => {
        console.error('Error duplicating template:', error);
        this._toastr.error('Failed to duplicate template', 'Error');
      }
    });
  }


  // API CALL TO TOGGLE STATUS
  toggleStatus(template: PayrollTemplate): void {
    const newStatus = template.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const payload = {
      template_id: template._id,
      status: newStatus,
    };
    this._httpClient.post(API_ENDPOINTS.payroll.toggle_template_status, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        this._toastr.success(`Template ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`, 'Success');
        this.loadTemplates();
      },
      error: (error) => {
        console.error('Error toggling template status:', error);
        this._toastr.error('Failed to update template status', 'Error');
      }
    });
  }

  // API CALL TO DELETE TEMPLATE
  deleteTemplate(template: PayrollTemplate): void {
    if (template.used_by_count && template.used_by_count > 0) {
      this._toastr.warning('Cannot delete template assigned to employees. Deactivate instead.', 'Warning');
      return;
    }
    if (!confirm(`Are you sure you want to delete "${template.template_name}"?`)) {
      return;
    }
    const payload = {
      template_id: template._id,
    };
    this._httpClient.post(API_ENDPOINTS.payroll.delete_template, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        this._toastr.success('Template deleted successfully', 'Success');
        this.loadTemplates();
      },
      error: (error) => {
        console.error('Error deleting template:', error);
        this._toastr.error('Failed to delete template', 'Error');
      }
    });
  }

  formatCurrency(val: number | undefined): string {
    if (!val && val !== 0) return '--';
    return '\u20B9' + val.toLocaleString('en-IN');
  }

  getMonthlyCtc(template: PayrollTemplate): number {
    return template.ctc_preview?.net_monthly_salary || 0;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
