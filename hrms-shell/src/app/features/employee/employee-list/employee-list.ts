import { SelectionModel } from '@angular/cdk/collections';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule, Location } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { API_ENDPOINTS } from '../../../core/config/api-endpoints';
import { ApiClient } from '../../../core/services/api-client.service';
import { CommonService } from '../../../core/services/common.service';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { MATERIAL } from '../../../shared/material/materials';
import { environment } from '../../../../environments/environement';
import { FieldConfig } from '../../../shared/dialogs/dynamic-fields-dialog/dynamic-fields-dialog';



@Component({
  selector: 'app-employee-list',
  imports: [MATERIAL, CommonModule, RouterModule, PageHeader, ScrollingModule],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.scss',
})
export class EmployeeList {
  private _httpClient = inject(ApiClient);
  private _commonService = inject(CommonService);
  private _location = inject(Location);
  private cdr = inject(ChangeDetectorRef);

  // Page header tabs (for the reusable header)
  // pageTabs: HeaderTab[] = [
  //   { id: 'all', label: 'All' },
  //   { id: 'active', label: 'Active' },
  //   { id: 'inactive', label: 'Inactive' }
  // ];

  // Two-way bound active tab
  currentTab: string | number | null = 'all';

  fieldsConfig: FieldConfig[] = []


  displayedColumns: string[] = ['select', 'name', 'role', 'department', 'mobile', 'joiningDate', 'email', 'gender', 'address'];
  employees: any[] = [];
  selection = new SelectionModel<any>(true, []);
  destroy$ = new Subject<void>();

  // Virtual scroll properties
  itemSize = 60; // Height of each row in pixels
  currentPage = 1;
  pageSize = 20;
  isLoadingMore = false;
  hasMoreData = true;
  totalItems = 0;

  ngOnInit() {
    this.loadLookupData();
    this.getEmployee();
  }

  async loadLookupData() {
    const categories = API_ENDPOINTS.lookup.categories;
    const lookupData = await this._commonService.getBulkLookupData([
      categories.gender,
      categories.employee_type,
      categories.work_mode,
      categories.status
    ]);

    if (lookupData) {
      this.updateFieldOptions('gender', lookupData[categories.gender]);
      this.updateFieldOptions('employment_type', lookupData[categories.employee_type]);
      this.updateFieldOptions('work_mode', lookupData[categories.work_mode]);
      this.updateFieldOptions('status', lookupData[categories.status]);
    }
  }

  private updateFieldOptions(controlName: string, options: any[]) {
    const field = this.fieldsConfig.find(f => f.controlName === controlName);
    if (field && options) {
      field.options = options;
    }
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.employees.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.employees);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    // Reset and fetch with search
    this.currentPage = 1;
    this.employees = [];
    this.hasMoreData = true;
    this.getEmployee(1, filterValue);
  }

  getEmployee(page: number = 1, searchKey: string = '') {
    if (this.isLoadingMore || !this.hasMoreData) return;

    this.isLoadingMore = true;
    const payload = {
      page: page,
      limit: this.pageSize,
      search_key: searchKey
    }

    console.log('Fetching employees with payload:', payload);

    this._httpClient.post(API_ENDPOINTS.employee.get_employee_list, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        console.log('Full API Response:', res);
        this.isLoadingMore = false;

        if (res.sts === 200 && res.data?.data) {
          console.log('Raw employee data:', res.data.data);

          const mappedData = res.data.data.map((emp: any) => ({
            _id: emp._id,
            name: emp.personal_details ? `${emp.personal_details.firstName || ''} ${emp.personal_details.lastName || ''}`.trim() : 'N/A',
            email: emp.job_details?.workEmail || emp.personal_details?.email || 'N/A',
            role: emp.job_details?.role_id || 'N/A',
            department: emp.job_details?.department_id || 'N/A',
            mobile: emp.personal_details?.phone || 'N/A',
            joiningDate: emp.job_details?.joiningDate || null,
            gender: emp.personal_details?.gender || 'N/A',
            address: emp.personal_details?.address || 'N/A',
            avatar: emp.profileImageUrl ? `${environment.apiUrl}${emp.profileImageUrl}` :
              `https://ui-avatars.com/api/?name=${encodeURIComponent(`${emp.personal_details?.firstName || 'Emp'}`)}&background=random`
          }));

          console.log('Mapped employee data:', mappedData);

          // Append new data to existing data
          if (page === 1) {
            this.employees = mappedData;
          } else {
            this.employees = [...this.employees, ...mappedData];
          }

          console.log('Total employees after assignment:', this.employees.length);
          console.log('Employees array:', this.employees);

          // Update pagination info
          if (res.data.pagination) {
            this.totalItems = res.data.pagination.total;
          }

          // Check if there's more data
          if (mappedData.length < this.pageSize || (res.data.pagination && page >= res.data.pagination.totalPages)) {
            this.hasMoreData = false;
          }

          // Manually trigger change detection
          this.cdr.detectChanges();
        } else {
          console.warn('Invalid response structure or no data');
          this.hasMoreData = false;
        }
      },
      error: (err) => {
        console.error('Error fetching employees:', err);
        this.isLoadingMore = false;
        this.hasMoreData = false;
      }
    })
  }

  onScrollIndexChange(index: number) {
    // Load more when user scrolls near the end
    const end = this.employees.length;
    const threshold = end - 5; // Load more when 5 items from the end

    if (index >= threshold && !this.isLoadingMore && this.hasMoreData) {
      this.currentPage++;
      this.getEmployee(this.currentPage);
    }
  }

  trackByEmployeeId(index: number, employee: any): string {
    return employee._id;
  }

  handleBack() {
    this._location.back();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
