import { Component, signal, inject, OnInit } from '@angular/core';
import { MATERIAL } from '../../../shared/material/materials';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeader, HeaderTab } from '../../../shared/components/page-header/page-header';
import { CommonService } from '../../../core/services/common.service';
import { ApiClient } from '../../../core/services/api-client.service';
import { ToastrService } from 'ngx-toastr';
import { API_ENDPOINTS } from '../../../core/config/api-endpoints';

@Component({
  selector: 'app-weekly-off-setup',
  imports: [MATERIAL, CommonModule, FormsModule, PageHeader],
  templateUrl: './weekly-off-setup.html',
  styleUrl: './weekly-off-setup.scss',
})
export class WeeklyOffSetup implements OnInit {
  private _commonService = inject(CommonService);
  private _location = inject(Location);
  private _httpClient = inject(ApiClient);
  private _toastr = inject(ToastrService);

  currentTab: string | number | null = null;
  pageTabs: any[] = [];

  policyName = '';
  effectiveDate = new Date();
  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Data Structure: { weekNumber: { dayName: boolean } }
  // Initialize grid where everything is working (false)
  matrix = signal<any>(this.initMatrix());

  async ngOnInit() {
    this.pageTabs = await this._commonService.getTabs('LEAVE_ADMIN');
    if (this.pageTabs.length > 0) {
      this.currentTab = this.pageTabs[3].key; // Weekly Off tab
    }
  }

  initMatrix() {
    const m: any = {};
    [1, 2, 3, 4, 5].forEach(w => {
      m[w] = {};
      this.weekDays.forEach(d => m[w][d] = false); // Default Working
    });
    return m;
  }

  isOff(week: number, day: string) {
    return this.matrix()[week][day];
  }

  toggleDay(week: number, day: string) {
    this.matrix.update(m => {
      const newM = { ...m };
      newM[week][day] = !newM[week][day];
      return newM;
    });
  }

  toggleAllColumn(day: string) {
    this.matrix.update(m => {
      const newM = { ...m };
      // Check first week to determine toggle state
      const nextState = !newM[1][day];
      [1, 2, 3, 4, 5].forEach(w => newM[w][day] = nextState);
      return newM;
    });
  }

  saveWeekOffs() {
    const payload = {
      name: this.policyName,
      effectiveFrom: this.effectiveDate.toISOString(),
      offDays: this.matrix()
    };
    this._httpClient.post(API_ENDPOINTS.leave.create_weekly_off, payload).subscribe({
      next: () => {
        this._toastr.success('Weekly Off Policy saved successfully!');
      },
      error: (err: any) => {
        console.error('Error saving policy:', err);
      }
    });
  }

  handleBack() {
    this._location.back();
  }
}
