import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MATERIAL } from '../../../shared/material/materials';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { LeaveTypeDialog } from '../../../shared/dialogs/leave-type-dialog/leave-type-dialog';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { CommonService } from '../../../core/services/common.service';
import { ApiClient } from '../../../core/services/api-client.service';
import { Subject, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { API_ENDPOINTS } from '../../../core/config/api-endpoints';

// --- 1. INTERFACE ---
export interface LeaveType {
  id: number;
  code: string;       // CL, SL
  name: string;       // Casual Leave
  description?: string;
  category: 'Paid' | 'Unpaid';
  colorCode: string;  // Hex color
  isSystem: boolean;  // True for LOP (cannot delete)
  isActive: boolean;
}

@Component({
  selector: 'app-leave-type-config',
  imports: [MATERIAL, FormsModule, ReactiveFormsModule, CommonModule, PageHeader],
  templateUrl: './leave-type-config.html',
  styleUrl: './leave-type-config.scss',
})
export class LeaveTypeConfig implements OnInit, OnDestroy {
  private _commonService = inject(CommonService)
  private dialog = inject(MatDialog);
  private _location = inject(Location);
  private _httpClient = inject(ApiClient);
  private _toastr = inject(ToastrService);
  currentTab: string | number | null = null
  pageTabs: any[] = [];
  displayedColumns: string[] = ['color', 'identity', 'category', 'status', 'actions'];
  dataSource = new MatTableDataSource<LeaveType>([]);
//   leaveTypes = signal<LeaveType[]>(
//     [
//     { id: 1, code: 'CL', name: 'Casual Leave', category: 'Paid', colorCode: '#10b981', isSystem: false, isActive: true, description: 'For personal matters' },
//     { id: 2, code: 'SL', name: 'Sick Leave', category: 'Paid', colorCode: '#f59e0b', isSystem: false, isActive: true, description: 'Medical reasons' },
//     { id: 3, code: 'EL', name: 'Earned Leave', category: 'Paid', colorCode: '#3f51b5', isSystem: false, isActive: true, description: 'Privilege leave earned over time' },
//     { id: 4, code: 'LOP', name: 'Loss Of Pay', category: 'Unpaid', colorCode: '#ef4444', isSystem: true, isActive: true, description: 'Unpaid leave deduction' },
//   ]
// );
  destroy$ = new Subject<void>();

  async ngOnInit() {
    this.pageTabs = await this._commonService.getTabs('LEAVE_ADMIN')
    if (this.pageTabs.length > 0) {
      this.currentTab = this.pageTabs[0].key
    }
    this.getLeaveTypes();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  // ===== DIALOG FOR ADD/EDIT LEAVE TYPE =====
  openDialog(leave?: LeaveType) {
    const dialogRef = this.dialog.open(LeaveTypeDialog, {
      width: '500px',
      data: leave || null
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.saveLeaveType(result);
        this.getLeaveTypes();
      }
    });
  }

  // ====== API FOR TO SAVE LEAVE TYPE ======
  saveLeaveType(leave: LeaveType) {
    const payload: any = {
      "name": leave.name,
      "code": leave.code,
      "category": leave.category.toUpperCase(),
      "color": leave.colorCode,
      "description": leave.description,
      "is_system": leave.isSystem,
      "is_active": leave.isActive
    }
    if (leave.id) {
      payload['id'] = leave.id;
    }
    this._httpClient.post(API_ENDPOINTS.leave.save_leave_types, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (_res: any) => {
        this._toastr.success('Leave type saved successfully');
        this.getLeaveTypes();
      },
      error: (err: any) => {
        this._toastr.error(err?.msg || 'Failed to save leave type');
      }
    });
  }

  // ======= GET LEAVE TYPE LIST =======
  getLeaveTypes() {
    const payload = {
      search_key: '',
      page: 1,
      limit: 10
    }
    this._httpClient.post(API_ENDPOINTS.leave.get_leave_types, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const apiData = res?.data?.data || [];
        if (Array.isArray(apiData)) {
          // Map API response to LeaveType interface
          const mappedData: LeaveType[] = apiData.map((item: any) => ({
            id: item._id,
            code: item.code,
            name: item.name,
            description: item.description || '',
            category: item.category === 'PAID' ? 'Paid' : 'Unpaid',
            colorCode: item.color || '#3f51b5',
            isSystem: item.is_system || false,
            isActive: item.is_active !== false
          }));
          this.dataSource.data = mappedData;
        }
      },
      error: (err: any) => {
        console.error('Failed to fetch leave types', err);
        this._toastr.error('Failed to load leave types');
      }
    });
  }

  // ====== TOGGLE LEAVE TYPE STATUS ======
  toggleStatus(leave: LeaveType) {
    if (leave.isSystem) return; 
    const payload = {
      id: leave.id,
      is_active: !leave.isActive
    }
    this._httpClient.post(API_ENDPOINTS.leave.status_change_leave_type, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (_res: any) => {
        this._toastr.success(`Leave type ${leave.isActive ? 'disabled' : 'enabled'} successfully`);
        this.getLeaveTypes();
      },
      error: (err: any) => {
        console.error('Failed to update leave type status', err);
        // this._toastr.error('Failed to update leave type status');
      }
    });
  }

  //======= HANDLE BACK NAVIGATION =======
  handleBack() {
    this._location.back();
  }

  //======= CLEANUP =======
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
