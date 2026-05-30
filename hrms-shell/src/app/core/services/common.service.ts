import { inject, Injectable } from '@angular/core';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { ApiClient } from './api-client.service';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { TOP_NAV_TABS_CONFIG } from './tabs.service';

export interface BasicEmployeeDetails {
  name: string;
  email: string;
  manager_id: string;
  phone_number: string;
  manager_name?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  private _httpClient = inject(ApiClient);
  destroy$ = new Subject<void>();

  async getUserDetails() {
    const raw = sessionStorage.getItem('userDetails');
    if (!raw) return null;
    try {
      const userDetails = JSON.parse(raw);
      return userDetails ?? null;
    } catch (e) {
      console.error('Failed to parse userDetails from sessionStorage', e);
      return null;
    }
  }


  async getLookupData() {
    try {
      const payload = {
        category: ''
      }
      const response: any = await firstValueFrom(
        this._httpClient.post(API_ENDPOINTS.lookup.getLookupData, payload).pipe(takeUntil(this.destroy$))
      );
      return response?.data ?? [];
    } catch (error) {
      console.error('Error fetching lookup data:', error);
      return [];
    }
  }

  async getBulkLookupData(categories: string[]) {
    try {
      const payload = {
        categories: categories
      }
      const response: any = await firstValueFrom(
        this._httpClient.post(API_ENDPOINTS.lookup.getBulkLookupData, payload).pipe(takeUntil(this.destroy$))
      );
      return response?.data ?? [];
    } catch (error) {
      console.error('Error fetching lookup data:', error);
      return [];
    }
  }

  async getTabs(subFeatureKey: string) {
    return TOP_NAV_TABS_CONFIG.filter(
      (tab: any) => tab.subFeatureKey === subFeatureKey
    );
  }

  async getBasicEmployeeDetails(employee_uuid: string): Promise<BasicEmployeeDetails | null> {
    try {
      const payload = { employee_uuid };

      const res: any = await firstValueFrom(
        this._httpClient.post(API_ENDPOINTS.employee.get_employee_details, payload)
      );
      const employee = res?.data;
      if (!employee) return null;
      return {
        name: `${employee.personal_details?.firstName || ''} ${employee.personal_details?.lastName || ''}`.trim(),
        email: employee.personal_details?.email || '',
        manager_id: employee.job_details?.reported_to || '',
        phone_number: employee.personal_details?.phone || '',
        manager_name: employee.manager_details
      };

    } catch (error) {
      console.error('Error fetching employee details:', error);
      return null;
    }
  }

  getSessionData(key: string = 'Token', defaultValue = null) {
    try {
      const data = sessionStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error(`SessionStorage error for key: ${key}`, error);
      return defaultValue;
    }
  }
}
