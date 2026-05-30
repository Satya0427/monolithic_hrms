import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { MATERIAL } from '../../../shared/material/materials';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from "@angular/router";
import { Location } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { HeaderTab, PageHeader } from "../../../shared/components/page-header/page-header";
import { CommonService } from '../../../core/services/common.service';
import { API_ENDPOINTS } from '../../../core/config/api-endpoints';
import { ApiClient } from '../../../core/services/api-client.service';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-leave-policy-list',
  imports: [MATERIAL, CommonModule, FormsModule, RouterModule, PageHeader],
  templateUrl: './leave-policy-list.html',
  styleUrl: './leave-policy-list.scss',
})
export class LeavePolicyList implements OnInit, OnDestroy {
  private _commonService = inject(CommonService)
  private _location = inject(Location);
  private _httpClient = inject(ApiClient);
  private _toastr = inject(ToastrService);
  displayedColumns = ['name', 'applicability', 'types', 'status', 'actions'];

  currentTab: string | number | null = null
  pageTabs: any[] = [];
  dataSource = new MatTableDataSource<any>([]);

  destroy$ = new Subject<void>();
  async ngOnInit() {
    this.pageTabs = await this._commonService.getTabs('LEAVE_ADMIN')
    if (this.pageTabs.length > 0) {
      this.currentTab = this.pageTabs[1].key
    }
    this.fetchPolicies()
  }

  // ========== API CALL TO FETCH LEAVE POLICIES ============
  fetchPolicies() {
    const payload = {
      page: 1,
      limit: 10,
      search_key: '',
    };
    this._httpClient.post(API_ENDPOINTS.leave.get_policies, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const apiData = res?.data?.policies_data || [];
        const mappedPolicies = apiData.map((policy: any) => ({
          id: policy._id,
          basicInfo: {
            policyName: policy.policy_name,
            description: policy.description,
            effectiveFrom: policy.effective_from,
            effectiveTo: policy.effective_to,
            status: this.formatStatus(policy.status)
          },
          applicability: {
            employeeType: this.formatApplicability(policy.applicability.employee_type),
            gender: policy.applicability.gender,
            maritalStatus: policy.applicability.marital_status,
            probation: policy.applicability.allow_during_probation,
            noticePeriod: policy.applicability.allow_during_notice_period
          },
          leaveRules: policy.leave_rules?.map((rule: any) => ({
            leaveType: `Leave Type (${rule.leave_type_id.slice(-4)})`,
            leaveTypeId: rule.leave_type_id,
            accrual: rule.accrual,
            restrictions: rule.restrictions,
            approval: rule.approval
          })) || [],
          sandwichRule: policy.sandwich_rule,
          createdAt: policy.createdAt,
          updatedAt: policy.updatedAt
        }));

        this.dataSource.data = mappedPolicies;
      },
      error: (err) => {
        this._toastr.error('Failed to fetch leave policies');
      }
    });
  }

  // ========== DELETE POLICY WITH CONFIRMATION ============
  deletePolicy(policy: any) {
    if (confirm(`Are you sure you want to delete the policy "${policy.basicInfo.policyName}"?`)) {
      const payload = {
        id: policy.id
      };
      this._httpClient.post(`${API_ENDPOINTS.leave.delete_policy}`,payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this._toastr.success('Policy deleted successfully');
          this.fetchPolicies();
        },
        error: () => {
          this._toastr.error('Failed to delete policy');
        }
      });
    }
  }

  formatStatus(status: string): string {
    if (!status) return 'Draft';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  formatApplicability(type: string): string {
    if (type === 'ALL') return 'All';
    // Convert FULL_TIME to Full Time, etc.
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  handleBack() {
    this._location.back();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
