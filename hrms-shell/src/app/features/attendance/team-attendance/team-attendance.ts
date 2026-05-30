import { Component, inject, signal } from '@angular/core';
import { MATERIAL } from '../../../shared/material/materials';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { ApiClient } from '../../../core/services/api-client.service';
import { Subject, takeUntil } from 'rxjs';
import { CommonService } from '../../../core/services/common.service';
import { API_ENDPOINTS } from '../../../core/config/api-endpoints';
import { environment } from '../../../../environments/environement';

@Component({
  selector: 'app-team-attendance',
  imports: [MATERIAL, CommonModule, FormsModule, RouterLink, PageHeader],
  templateUrl: './team-attendance.html',
  styleUrl: './team-attendance.scss',
})
export class TeamAttendance {
  private _httpClient = inject(ApiClient);
  private destroy$ = new Subject<void>();
  private _commonService = inject(CommonService);
  // Data
  employees = signal<any[]>([]);
  searchKey = '';

  currentTab: string | number | null = null;
  pageTabs: any[] = [];

  async ngOnInit() {
    this.pageTabs = await this._commonService.getTabs('LEAVE_BALANCE');
    if (this.pageTabs.length > 0) {
      this.currentTab = this.pageTabs[4]?.key || null; // Leave Balance tab
    }
    this.loadEmployees();
  }

  loadEmployees() {
    const payload = {
      page: 1,
      limit: 50,
      search_key: this.searchKey
    };
    this._httpClient.post(API_ENDPOINTS.common.employee_list_by_manager, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.sts === 200 && res.data?.employees) {
          const mappedData: any = res.data.employees.map((emp: any) => ({
            _id: emp._id,
            emp_id: emp.emp_id || emp.employee_id || 'N/A',
            name: emp.name || 'N/A',
            role: emp.role || 'N/A',
            joiningDate: emp.joiningDate || null,
            avatar: emp.avatar
              ? `${environment.apiUrl}/common/get_image/${emp.avatar}`
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name || 'Emp')}&background=random`

          }));
          this.employees.set(mappedData);
        }
      },
      error: (err) => {
        console.error('Error fetching employees:', err);
      }
    });
  }

  onSearch() {
    this.loadEmployees();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
