import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCalendar, MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MATERIAL } from '../../../shared/material/materials';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WfhRequestDialog } from '../../../shared/dialogs/wfh-request-dialog/wfh-request-dialog';
import { RegularizationDialog } from '../../../shared/dialogs/regularization-dialog/regularization-dialog';
import { ToastrService } from 'ngx-toastr';
import { ApiClient } from '../../../core/services/api-client.service';
import { BasicEmployeeDetails, CommonService } from '../../../core/services/common.service';
import { Subject, take, takeUntil } from 'rxjs';
import { API_ENDPOINTS } from '../../../core/config/api-endpoints';
import { ActivatedRoute } from '@angular/router';
import { PageHeader } from "../../../shared/components/page-header/page-header";


@Component({
  selector: 'app-my-attendance',
  standalone: true,
  imports: [
    CommonModule,
    MATERIAL,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatTooltipModule,
    MatRippleModule,
    PageHeader
],
  templateUrl: './my-attendance.html',
  styleUrls: ['./my-attendance.scss'],
})
export class MyAttendance implements OnInit, OnDestroy {
  private _dialog = inject(MatDialog);
  private _toastr = inject(ToastrService);
  private _httpClient = inject(ApiClient);
  private _commonService = inject(CommonService);
  private _route = inject(ActivatedRoute);
  private _cdr = inject(ChangeDetectorRef);

  @ViewChild(MatCalendar) calendar!: MatCalendar<Date>;

  userDetails!: BasicEmployeeDetails | null;

  isClockingIn = false;
  isClockingOut = false;
  isWfhClockingIn = false;
  destroy$ = new Subject<void>();

  // ===== TODAY STRIP DYNAMIC STATE =====
  todayStatus: 'not-checked-in' | 'checked-in' | 'checked-out' = 'not-checked-in';
  todayDate = '';
  todayShift = '--';
  clockInTime: Date | null = null;
  clockOutTime: Date | null = null;
  clockInDisplay = '--';
  clockOutDisplay = '--';
  breakMinutes = 0;
  lateMinutes = 0;
  workedDisplay = '00:00:00';
  workedPercent = 0;
  private shiftDurationHrs = 9; // 9-hour shift
  private timerInterval: any = null;
  id!: string;

  get ringGradient(): string {
    let color = '#94a3b8'; // gray - not checked in
    if (this.todayStatus === 'checked-in') color = '#10b981';  // green
    if (this.todayStatus === 'checked-out') color = '#ef4444'; // red
    return `conic-gradient(${color} 0% ${this.workedPercent}%, #e2e8f0 ${this.workedPercent}% 100%)`;
  }

  async ngOnInit(): Promise<void> {
    this.id = this._route.snapshot.paramMap.get('id')!;
    this.todayDate = new Date().toLocaleDateString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric', weekday: 'long'
    });
    this.userDetails = await this._commonService.getBasicEmployeeDetails(this.id);
    this.getClockLogs();
    this.monthlySummary();
    this.getMonthlyLogs();
  }



  // ======== WEB CLOCK IN/OUT WITH GEOLOCATION ========
  async webClockIn(): Promise<void> {
    this.isClockingIn = true;
    const payload = {
      punch_time: new Date(),
      source: 'WEB',
      device_info: navigator.userAgent,
      geo_location: {},
      is_manual_entry: false
    };

    // Attempt to get geolocation with a timeout of 5 seconds
    if (navigator.geolocation) {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      ).catch(() => null);
      if (position) {
        payload.geo_location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
      }
    }

    this._httpClient.post(API_ENDPOINTS.attendance.clock_in, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (_res) => {
        this._toastr.success('Clocked in successfully!', 'Close', { timeOut: 3000 });
        this.onClockInSuccess(payload.punch_time);
      },
      error: (error) => {
        console.error('Clock-in failed', error);
      }
    }).add(() => {
      this.isClockingIn = false;
    });
  }

  /** Called after successful clock-in to start live timer */
  private onClockInSuccess(punchTime: Date): void {
    this.clockInTime = punchTime;
    this.clockOutTime = null;
    this.clockOutDisplay = '--';
    this.clockInDisplay = this.formatTime(punchTime);
    this.todayStatus = 'checked-in';
    this.startLiveTimer();
  }

  // ======== WFH CLOCK IN ========
  async wfhClockIn(): Promise<void> {
    this.isWfhClockingIn = true;
    const payload = {
      punch_time: new Date(),
      source: 'WEB',
      work_mode: 'WFH',
      device_info: navigator.userAgent,
      geo_location: {},
      is_manual_entry: false
    };

    if (navigator.geolocation) {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      ).catch(() => null);
      if (position) {
        payload.geo_location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
      }
    }

    this._httpClient.post(API_ENDPOINTS.attendance.wfh_clock_in, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (_res) => {
        this._toastr.success('WFH Clock-in successful!', 'Close', { timeOut: 3000 });
        this.onClockInSuccess(payload.punch_time);
      },
      error: (error) => {
        console.error('WFH Clock-in failed', error);
      }
    }).add(() => {
      this.isWfhClockingIn = false;
    });
  }


  /** Called after successful clock-out to stop timer */
  private onClockOutSuccess(punchTime: Date): void {
    this.clockOutTime = punchTime;
    this.clockOutDisplay = this.formatTime(punchTime);
    this.todayStatus = 'checked-out';
    this.stopLiveTimer();
    this.updateWorkedTime(); // freeze final value
  }

  // ======= WEB CLOCK OUT WITH GEOLOCATION ========
  async webClockOut(): Promise<void> {
    this.isClockingOut = true;
    const payload = {
      punch_time: new Date(),
      source: 'WEB',
      device_info: navigator.userAgent,
      geo_location: {},
      is_manual_entry: false
    };

    if (navigator.geolocation) {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      ).catch(() => null);
      if (position) {
        payload.geo_location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
      }
    }
    this._httpClient.post(API_ENDPOINTS.attendance.clock_out, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this._toastr.success('Clocked out successfully!', 'Close', { timeOut: 3000 });
        this.onClockOutSuccess(payload.punch_time);
      },
      error: (error) => {
        this._toastr.error('Clock-out failed. Please try again.', 'Close', { timeOut: 4000 });
      }
    }).add(() => {
      this.isClockingOut = false;
    });
  }



  get lateDisplay(): string {
    if (this.lateMinutes <= 0) return '';
    const hrs = Math.floor(this.lateMinutes / 60);
    const mins = this.lateMinutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m late`;
    return `${mins}m late`;
  }

  // ======== GET CLOCK STATUS ON INIT (IN CASE OF PAGE REFRESH) ========
  private getClockLogs() {
    const payload = {
      employee_uuid: this.id
    };
    this._httpClient.post(API_ENDPOINTS.attendance.get_clock_status, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        const data = response?.data || response;
        const shift = data.attendance_record?.shift_snapshot;
        if (shift) {
          this.todayShift = `${shift.shift_name} (${shift.start_time} – ${shift.end_time})`;
          const [startH, startM] = shift.start_time.split(':').map(Number);
          const [endH, endM] = shift.end_time.split(':').map(Number);
          this.shiftDurationHrs = (endH + endM / 60) - (startH + startM / 60);
        }
        this.lateMinutes = data.attendance_record?.late_minutes || 0;
        this.breakMinutes = data.attendance_record?.total_break_minutes || 0;
        if (data.first_check_in) {
          this.onClockInSuccess(new Date(data.first_check_in));
          if (data.last_check_out) {
            this.onClockOutSuccess(new Date(data.last_check_out));
          }
        }
      },
      error: (error) => {
        console.error('Failed to get clock status', error);
      }
    });
  }

  // ====== CLACULATION OF WORKED HOURS, LIVE TIMER, AND UI UPDATES ======
  calculateWorkedHours() {
    this._httpClient.get(API_ENDPOINTS.attendance.attendance_calculation).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        const data = response?.data || response;
        this.breakMinutes = data.break_minutes || 0;
        const workedSec = data.worked_seconds || 0;
        const hrs = Math.floor(workedSec / 3600);
        const mins = Math.floor((workedSec % 3600) / 60);
        const secs = workedSec % 60;
        this.workedDisplay = `${this.pad(hrs)}:${this.pad(mins)}:${this.pad(secs)}`;
        this.workedPercent = Math.min(100, Math.round((workedSec / (this.shiftDurationHrs * 3600)) * 100));
      },
      error: (error) => {
        console.error('Failed to calculate worked hours', error);
      }
    });
  }

  // ====== MONTHLY SUMMARY ======
  monthlySummary() {
    const payload = {
      employee_uuid: this.id
    };
    this._httpClient.post(API_ENDPOINTS.attendance.get_monthly_attendance, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        const data = response?.data || response;
        this.summaryCards[0].value = String(data.present ?? 0).padStart(2, '0');
        this.summaryCards[1].value = String(data.absent ?? 0).padStart(2, '0');
        this.summaryCards[2].value = String(data.late_arrivals ?? 0).padStart(2, '0');
        this.summaryCards[3].value = String(data.early_exits ?? 0).padStart(2, '0');
        this.summaryCards[4].value = String(data.wfh_days ?? 0).padStart(2, '0');
        this.summaryCards[5].value = data.overtime_label || '0h 0m';
      },
      error: (error) => {
        console.error('Failed to get monthly summary', error);
      }
    });
  }

  // ======== GET ATTENDANCE LOGS FOR THE MONTH ========
  getMonthlyLogs() {
    const payload = {
      employee_uuid: this.id
    };
    this._httpClient.post(API_ENDPOINTS.attendance.get_clock_logs, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        const data = response?.data || response;
        const records: any[] = data.records || [];

        // Map API records to table logs
        this.logs = records.map((rec: any) => {
          const workMins = rec.total_work_minutes || 0;
          const breakMins = rec.total_break_minutes || 0;
          return {
            date: rec.attendance_date
              ? new Date(rec.attendance_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
              : '--',
            checkIn: rec.first_check_in ? this.formatTime(new Date(rec.first_check_in)) : '--',
            checkOut: rec.last_check_out ? this.formatTime(new Date(rec.last_check_out)) : '--',
            workDuration: workMins > 0 ? `${Math.floor(workMins / 60)}h ${workMins % 60}m` : '--',
            breakDuration: breakMins > 0 ? `${breakMins}m` : '--',
            status: this.formatStatus(rec.status),
            shiftName: rec.shift_snapshot
              ? `${rec.shift_snapshot.shift_name} (${rec.shift_snapshot.start_time} - ${rec.shift_snapshot.end_time})`
              : '--',
            lateMinutes: rec.late_minutes || 0,
            earlyMinutes: rec.early_exit_minutes || 0
          };
        });

        // Build calendar status map from records
        this.calendarStatusMap.clear();
        records.forEach((rec: any) => {
          if (!rec.attendance_date) return;
          const key = this.formatDateKey(new Date(rec.attendance_date));
          this.calendarStatusMap.set(key, this.mapStatusToCalendarClass(rec.status));
        });

        // Build daily detail map for hover tooltips
        this.dailyDetailMap.clear();
        records.forEach((rec: any) => {
          if (!rec.attendance_date) return;
          const key = this.formatDateKey(new Date(rec.attendance_date));
          const workMins = rec.total_work_minutes || 0;
          const breakMins = rec.total_break_minutes || 0;
          this.dailyDetailMap.set(key, {
            dateLabel: new Date(rec.attendance_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            status: this.formatStatus(rec.status),
            clockIn: rec.first_check_in ? this.formatTime(new Date(rec.first_check_in)) : '--',
            clockOut: rec.last_check_out ? this.formatTime(new Date(rec.last_check_out)) : '--',
            workDuration: workMins > 0 ? `${Math.floor(workMins / 60)}h ${workMins % 60}m` : '--',
            breakDuration: breakMins > 0 ? `${breakMins}m` : '--',
            shiftName: rec.shift_snapshot
              ? `${rec.shift_snapshot.shift_name} (${rec.shift_snapshot.start_time} - ${rec.shift_snapshot.end_time})`
              : '--'
          });
        });

        // Reassign dateClass to force calendar re-render with new status colors
        this.dateClass = (cellDate, view) => {
          if (view !== 'month') return '';
          const key = this.formatDateKey(cellDate);
          return this.calendarStatusMap.get(key) ?? '';
        };
        // Force calendar to re-render cells
        setTimeout(() => {
          if (this.calendar) {
            this.calendar.updateTodaysDate();
          }
        });
      },
      error: (error) => {
        console.error('Failed to get monthly logs', error);
      }
    });
  }

  /** Convert API status like PRESENT, WEEK_OFF to display-friendly format */
  private formatStatus(status: string): string {
    const map: Record<string, string> = {
      'PRESENT': 'Present',
      'ABSENT': 'Absent',
      'WEEK_OFF': 'Weekly Off',
      'HALF_DAY': 'Half Day',
      'ON_LEAVE': 'On Leave',
      'HOLIDAY': 'Holiday',
      'WFH': 'Work From Home',
      'LATE': 'Late'
    };
    return map[status] || status;
  }

  /** Map API status to calendar CSS class */
  private mapStatusToCalendarClass(status: string): string {
    const map: Record<string, string> = {
      'PRESENT': 'present',
      'ABSENT': 'absent',
      'WEEK_OFF': 'weekly-off',
      'HALF_DAY': 'half-day',
      'ON_LEAVE': 'on-leave',
      'HOLIDAY': 'holiday',
      'WFH': 'wfh',
      'LATE': 'late'
    };
    return map[status] || '';
  }










  // ===== LIVE TIMER =====
  private startLiveTimer(): void {
    this.stopLiveTimer();
    this.updateWorkedTime();
    this.timerInterval = setInterval(() => this.updateWorkedTime(), 1000);
  }

  private stopLiveTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private updateWorkedTime(): void {
    if (!this.clockInTime) return;
    const endTime = this.clockOutTime ?? new Date();
    let diffMs = endTime.getTime() - this.clockInTime.getTime();
    if (diffMs < 0) diffMs = 0;

    const totalSec = Math.floor(diffMs / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    this.workedDisplay = `${this.pad(hrs)}:${this.pad(mins)}:${this.pad(secs)}`;
    this.workedPercent = Math.min(100, Math.round((totalSec / (this.shiftDurationHrs * 3600)) * 100));
    this._cdr.markForCheck();
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  private pad(n: number): string {
    return n < 10 ? '0' + n : '' + n;
  }


  openWfhDialog(): void {
    this._dialog.open(WfhRequestDialog, {
      panelClass: 'dynamic-dialog-panel',
      width: '560px',
      data: {
        requestDate: new Date(2026, 1, 12)
      }
    });
  }



















  summaryCards = [
    { label: 'Present', value: '--', icon: 'check_circle', accent: 'emerald' },
    { label: 'Absent', value: '--', icon: 'cancel', accent: 'red' },
    { label: 'Late Arrivals', value: '--', icon: 'schedule', accent: 'amber' },
    { label: 'Early Exits', value: '--', icon: 'exit_to_app', accent: 'orange' },
    { label: 'WFH Days', value: '--', icon: 'home_work', accent: 'teal' },
    { label: 'Overtime', value: '--', icon: 'trending_up', accent: 'indigo' }
  ];

  statusOptions = [
    'All',
    'Present',
    'Absent',
    'Holiday',
    'Weekly Off',
    'Half Day',
    'On Leave',
    'Work From Home'
  ];

  monthOptions = [
    { label: 'Feb 2026', value: '2026-02' },
    { label: 'Jan 2026', value: '2026-01' },
    { label: 'Dec 2025', value: '2025-12' }
  ];

  filters = new FormGroup({
    month: new FormControl(this.monthOptions[0].value),
    status: new FormControl(this.statusOptions[0])
  });

  displayedColumns = [
    'date',
    'checkIn',
    'checkOut',
    'workDuration',
    'status',
    'lateMinutes',
    'earlyMinutes',
    'action'
  ];

  logs: AttendanceLog[] = [];

  private calendarStatusMap = new Map<string, string>();

  private dailyDetailMap = new Map<string, AttendanceDayDetail>();

  selectedDate = new Date(2026, 1, 12);
  hoverDetail: AttendanceDayDetail | null = null;
  hoverPosition = { x: 0, y: 0 };

  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    if (view !== 'month') {
      return '';
    }

    const key = this.formatDateKey(cellDate);
    return this.calendarStatusMap.get(key) ?? '';
  };

  private formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  statusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  onDateSelect(date: any): void {
    this.selectedDate = date;
    this.openRegularizationDialog(this.getDetailForDate(date));
  }

  onCalendarHover(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    const cell = target?.closest('button.mat-calendar-body-cell') as HTMLElement | null;
    if (!cell) {
      this.hoverDetail = null;
      return;
    }

    const label = cell.getAttribute('aria-label');
    if (!label) {
      this.hoverDetail = null;
      return;
    }

    const date = new Date(label);
    if (Number.isNaN(date.getTime())) {
      this.hoverDetail = null;
      return;
    }

    this.hoverDetail = this.getDetailForDate(date);
    const wrapper = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.hoverPosition = {
      x: event.clientX - wrapper.left + 12,
      y: event.clientY - wrapper.top + 12
    };
  }

  clearCalendarHover(): void {
    this.hoverDetail = null;
  }



  openRegularizationDialog(log?: AttendanceLog | AttendanceDayDetail): void {
    const dateLabel = (log as AttendanceDayDetail)?.dateLabel ?? (log as AttendanceLog)?.date;
    const shiftName = (log as AttendanceDayDetail)?.shiftName ?? (log as AttendanceLog)?.shiftName;
    this._dialog.open(RegularizationDialog, {
      panelClass: 'dynamic-dialog-panel',
      width: '560px',
      data: {
        dateLabel: dateLabel ?? 'Feb 12, 2026',
        shiftName: shiftName ?? 'General (09:30 - 18:30)'
      }
    });
  }

  private getDetailForDate(date: Date): AttendanceDayDetail {
    const key = this.formatDateKey(date);
    return this.dailyDetailMap.get(key) ?? {
      dateLabel: this.formatDateLabel(date),
      status: 'No Data',
      clockIn: '--',
      clockOut: '--',
      workDuration: '--',
      breakDuration: '--',
      shiftName: 'General (09:30 - 18:30)'
    };
  }

  private formatDateLabel(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  }


  // ===== DESTROY SUBSCRIPTION =====
  ngOnDestroy(): void {
    this.stopLiveTimer();
    this.destroy$.next();
    this.destroy$.complete();
  }

}

interface AttendanceLog {
  date: string;
  checkIn: string;
  checkOut: string;
  workDuration: string;
  breakDuration: string;
  status: string;
  shiftName: string;
  lateMinutes: number;
  earlyMinutes: number;
}

interface AttendanceDayDetail {
  dateLabel: string;
  status: string;
  clockIn: string;
  clockOut: string;
  workDuration: string;
  breakDuration: string;
  shiftName: string;
}