import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { MATERIAL } from '../../../shared/material/materials';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { PageHeader, HeaderTab } from '../../../shared/components/page-header/page-header';
import { CommonService } from '../../../core/services/common.service';
import { HolidayDialog, Holiday, HolidayDialogData } from '../../../shared/dialogs/holiday-dialog/holiday-dialog';
import { ApiClient } from '../../../core/services/api-client.service';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { API_ENDPOINTS } from '../../../core/config/api-endpoints';

@Component({
  selector: 'app-holiday-calendar',
  imports: [MATERIAL, CommonModule, FormsModule, PageHeader],
  templateUrl: './holiday-calendar.html',
  styleUrl: './holiday-calendar.scss',
})
export class HolidayCalendar implements OnInit, OnDestroy {
  private _commonService = inject(CommonService);
  private _location = inject(Location);
  private dialog = inject(MatDialog);
  private _httpClient = inject(ApiClient);
  private _toastr = inject(ToastrService);
  private destroy$ = new Subject<void>();

  currentTab: string | number | null = null;
  pageTabs: any[] = [];
  selectedYear = new Date().getFullYear();

  displayedColumns = ['date', 'details', 'type', 'locations', 'actions'];
  dataSource = new MatTableDataSource<Holiday>([]);


  async ngOnInit() {
    this.pageTabs = await this._commonService.getTabs('LEAVE_ADMIN');
    if (this.pageTabs.length > 0) {
      this.currentTab = this.pageTabs[2].key; // Holiday Calendar tab
    }
    this.fetchHolidays();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openDialog(holiday?: Holiday) {
    const dialogRef = this.dialog.open(HolidayDialog, {
      width: '900px',
      maxHeight: '90vh',
      data: {
        holiday: holiday || null,
        onSave: (formData: any) => {
          this.createHoliday(formData, dialogRef);

        }
      },
      disableClose: false
    });
  }

  createHoliday(formData: any, dialogRef?: any) {
    const payload: any = {
      name: formData.name,
      date: this.formatDate(formData.date),
      description: formData.description || '',
      type: formData.type.toUpperCase(),
      is_optional: formData.isOptional,
      is_paid: formData.isPaid,
      color: formData.colorCode || '#3f51b5',
      applicable_to: formData.applicableTo,
      applicable_locations: formData.applicableTo === 'Specific' ? formData.locations : [],
      applicable_departments: formData.departments || [],
      applicable_employee_types: formData.employeeTypes || [],
      applicable_gender: formData.gender || [],
      optional_holiday_rules: formData.isOptional ? {
        max_optional_leaves: formData.maxOptionalLeaves || 0,
        requires_approval: formData.requiresApproval || false,
        auto_credit_leave: formData.autoCreditLeave || false,
        allow_carry_forward: formData.allowCarryForward || false
      } : null,

      is_active: formData.status === 'Active'
    };
    payload['id'] = formData.id || null; // Include ID for edit, null for create
    console.log('📦 Holiday API Payload:', payload);
    this._httpClient.post(API_ENDPOINTS.leave.create_holiday, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this._toastr.success('Holiday created successfully!');
        this.fetchHolidays();
        dialogRef?.close(); // Close dialog only on success
      },
      error: (err: any) => {
        console.error('Error creating holiday:', err);
        this._toastr.error(err?.error?.message || 'Failed to create holiday');
        if (dialogRef?.componentInstance) {
          dialogRef.componentInstance.isSaving = false; // Re-enable save button
        }
      }
    });
  }


  fetchHolidays() {
    const payload = {
      year: this.selectedYear,
      is_active: true
    };
    this._httpClient.post(API_ENDPOINTS.leave.get_holidays, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const apiData = res?.data?.data || [];
        const mappedHolidays: Holiday[] = apiData.map((item: any) => ({
          id: item.holiday_id,
          name: item.name,
          date: new Date(item.date),
          type: this.formatHolidayType(item.type),
          isOptional: item.is_optional,
          isPaid: item.is_paid,
          colorCode: item.color,
          applicableTo: item.applicable_locations?.length > 0 ? 'Specific' : 'All',
          locations: item.applicable_locations?.length > 0 ? item.applicable_locations : ['All'],
          description: item.description,
          status: item.is_active ? 'Active' : 'Inactive'
        }));
        this.dataSource.data = mappedHolidays;
      },
      error: (err: any) => {
        console.error('Error fetching holidays:', err);
      }
    });
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString();
  }

  private formatHolidayType(type: string): 'National' | 'Festival' | 'Company' {
    const formatted = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    return formatted as 'National' | 'Festival' | 'Company';
  }

  deleteHoliday(holiday: Holiday) {
    if (!confirm(`Are you sure you want to delete "${holiday.name}"?`)) {
      return;
    }
    const payload = {
      id: holiday.id
    };
    this._httpClient.post(`${API_ENDPOINTS.leave.delete_holiday}`, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this._toastr.success('Holiday deleted successfully!');
        this.fetchHolidays();
      },
      error: (err: any) => {
        console.error('Error deleting holiday:', err);
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
