import { inject, Injectable } from '@angular/core';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { ApiClient } from '../../../core/services/api-client.service';
import { API_ENDPOINTS } from '../../../core/config/api-endpoints';
import {
  SalaryComponent, ComponentType, ComponentStatus
} from '../../../core/models/payroll.models';

@Injectable({
  providedIn: 'root',
})
export class PayrollComponentService {
  private _http = inject(ApiClient);
  destroy$ = new Subject<void>();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. GET COMPONENTS LIST (with optional filters)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async getComponents(filters?: {
    component_type?: ComponentType;
    status?: ComponentStatus | 'all';
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<SalaryComponent[]> {
    const payload = {
      component_type: filters?.component_type || null,
      status: filters?.status === 'all' ? null : (filters?.status || null),
      search: filters?.search || null,
      page: filters?.page || 1,
      limit: filters?.limit || 100,
    };

    console.log('━━━ [GET COMPONENTS LIST] ━━━');
    console.log('📤 Endpoint:', API_ENDPOINTS.payroll.get_components);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

    try {
      const response: any = await firstValueFrom(
        this._http.post(API_ENDPOINTS.payroll.get_components, payload).pipe(takeUntil(this.destroy$))
      );
      console.log('✅ [GET COMPONENTS LIST] Response:', response);
      return response?.data ?? [];
    } catch (error) {
      console.error('❌ [GET COMPONENTS LIST] Error:', error);
      return [];
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. GET COMPONENT BY ID
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async getComponentById(componentId: string): Promise<SalaryComponent | null> {
    const payload = {
      component_id: componentId,
    };

    console.log('━━━ [GET COMPONENT BY ID] ━━━');
    console.log('📤 Endpoint:', API_ENDPOINTS.payroll.get_component_by_id);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

    try {
      const response: any = await firstValueFrom(
        this._http.post(API_ENDPOINTS.payroll.get_component_by_id, payload).pipe(takeUntil(this.destroy$))
      );
      console.log('✅ [GET COMPONENT BY ID] Response:', response);
      return response?.data ?? null;
    } catch (error) {
      console.error('❌ [GET COMPONENT BY ID] Error:', error);
      return null;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. CREATE COMPONENT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async createComponent(componentData: Partial<SalaryComponent>): Promise<any> {
    const payload = {
      component_name: componentData.component_name,
      component_code: componentData.component_code,
      component_type: componentData.component_type,
      component_category: componentData.component_category,
      calculation_type: componentData.calculation_type,
      fixed_amount: componentData.calculation_type === 'fixed' ? componentData.fixed_amount : null,
      percentage: componentData.calculation_type === 'percentage_of_basic' ? componentData.percentage : null,
      formula: componentData.calculation_type === 'formula' ? componentData.formula : null,
      taxable: componentData.taxable ?? false,
      pf_applicable: componentData.pf_applicable ?? false,
      esi_applicable: componentData.esi_applicable ?? false,
      professional_tax_applicable: componentData.professional_tax_applicable ?? false,
      show_in_payslip: componentData.show_in_payslip ?? true,
      pro_rated: componentData.pro_rated ?? false,
      include_in_ctc: componentData.include_in_ctc ?? true,
      effective_from: componentData.effective_from,
      status: componentData.status ?? 'ACTIVE',
      description: componentData.description || '',

      // Earning-specific
      ...(componentData.component_type === 'EARNINGS' && {
        is_basic: (componentData as any).is_basic ?? false,
      }),

      // Deduction-specific
      ...(componentData.component_type === 'DEDUCTIONS' && {
        deduction_nature: (componentData as any).deduction_nature,
        employer_contribution: (componentData as any).employer_contribution ?? false,
        employee_contribution: (componentData as any).employee_contribution ?? true,
        max_cap: (componentData as any).max_cap ?? null,
      }),

      // Reimbursement-specific
      ...(componentData.component_type === 'REIMBURSEMENTS' && {
        claim_based: (componentData as any).claim_based ?? false,
        attachment_required: (componentData as any).attachment_required ?? false,
        approval_required: (componentData as any).approval_required ?? true,
        max_limit_per_month: (componentData as any).max_limit_per_month ?? null,
      }),

      // Variable Pay-specific
      ...(componentData.component_type === 'VARIABLE_PAY' && {
        pay_frequency: (componentData as any).pay_frequency ?? 'monthly',
        linked_to_kpi: (componentData as any).linked_to_kpi ?? false,
        auto_calculate: (componentData as any).auto_calculate ?? false,
        manual_override: (componentData as any).manual_override ?? true,
      }),
    };

    console.log('━━━ [CREATE COMPONENT] ━━━');
    console.log('📤 Endpoint:', API_ENDPOINTS.payroll.create_component);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

    try {
      const response: any = await firstValueFrom(
        this._http.post(API_ENDPOINTS.payroll.create_component, payload).pipe(takeUntil(this.destroy$))
      );
      console.log('✅ [CREATE COMPONENT] Response:', response);
      return response;
    } catch (error) {
      console.error('❌ [CREATE COMPONENT] Error:', error);
      throw error;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. UPDATE COMPONENT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async updateComponent(componentId: string, componentData: Partial<SalaryComponent>): Promise<any> {
    const payload = {
      component_id: componentId,
      component_name: componentData.component_name,
      component_code: componentData.component_code,
      component_type: componentData.component_type,
      component_category: componentData.component_category,
      calculation_type: componentData.calculation_type,
      fixed_amount: componentData.calculation_type === 'fixed' ? componentData.fixed_amount : null,
      percentage: componentData.calculation_type === 'percentage_of_basic' ? componentData.percentage : null,
      formula: componentData.calculation_type === 'formula' ? componentData.formula : null,
      taxable: componentData.taxable ?? false,
      pf_applicable: componentData.pf_applicable ?? false,
      esi_applicable: componentData.esi_applicable ?? false,
      professional_tax_applicable: componentData.professional_tax_applicable ?? false,
      show_in_payslip: componentData.show_in_payslip ?? true,
      pro_rated: componentData.pro_rated ?? false,
      include_in_ctc: componentData.include_in_ctc ?? true,
      effective_from: componentData.effective_from,
      status: componentData.status ?? 'ACTIVE',
      description: componentData.description || '',

      // Earning-specific
      ...(componentData.component_type === 'EARNINGS' && {
        is_basic: (componentData as any).is_basic ?? false,
      }),

      // Deduction-specific
      ...(componentData.component_type === 'DEDUCTIONS' && {
        deduction_nature: (componentData as any).deduction_nature,
        employer_contribution: (componentData as any).employer_contribution ?? false,
        employee_contribution: (componentData as any).employee_contribution ?? true,
        max_cap: (componentData as any).max_cap ?? null,
      }),

      // Reimbursement-specific
      ...(componentData.component_type === 'REIMBURSEMENTS' && {
        claim_based: (componentData as any).claim_based ?? false,
        attachment_required: (componentData as any).attachment_required ?? false,
        approval_required: (componentData as any).approval_required ?? true,
        max_limit_per_month: (componentData as any).max_limit_per_month ?? null,
      }),

      // Variable Pay-specific
      ...(componentData.component_type === 'VARIABLE_PAY' && {
        pay_frequency: (componentData as any).pay_frequency ?? 'monthly',
        linked_to_kpi: (componentData as any).linked_to_kpi ?? false,
        auto_calculate: (componentData as any).auto_calculate ?? false,
        manual_override: (componentData as any).manual_override ?? true,
      }),
    };

    console.log('━━━ [UPDATE COMPONENT] ━━━');
    console.log('📤 Endpoint:', API_ENDPOINTS.payroll.update_component);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

    try {
      const response: any = await firstValueFrom(
        this._http.post(API_ENDPOINTS.payroll.update_component, payload).pipe(takeUntil(this.destroy$))
      );
      console.log('✅ [UPDATE COMPONENT] Response:', response);
      return response;
    } catch (error) {
      console.error('❌ [UPDATE COMPONENT] Error:', error);
      throw error;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. TOGGLE COMPONENT STATUS (activate / deactivate)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async toggleComponentStatus(componentId: string, newStatus: ComponentStatus): Promise<any> {
    const payload = {
      component_id: componentId,
      status: newStatus,
    };

    console.log('━━━ [TOGGLE COMPONENT STATUS] ━━━');
    console.log('📤 Endpoint:', API_ENDPOINTS.payroll.toggle_component_status);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

    try {
      const response: any = await firstValueFrom(
        this._http.post(API_ENDPOINTS.payroll.toggle_component_status, payload).pipe(takeUntil(this.destroy$))
      );
      console.log('✅ [TOGGLE COMPONENT STATUS] Response:', response);
      return response;
    } catch (error) {
      console.error('❌ [TOGGLE COMPONENT STATUS] Error:', error);
      throw error;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. DELETE COMPONENT (soft delete)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async deleteComponent(componentId: string): Promise<any> {
    const payload = {
      component_id: componentId,
    };

    console.log('━━━ [DELETE COMPONENT] ━━━');
    console.log('📤 Endpoint:', API_ENDPOINTS.payroll.delete_component);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

    try {
      const response: any = await firstValueFrom(
        this._http.post(API_ENDPOINTS.payroll.delete_component, payload).pipe(takeUntil(this.destroy$))
      );
      console.log('✅ [DELETE COMPONENT] Response:', response);
      return response;
    } catch (error) {
      console.error('❌ [DELETE COMPONENT] Error:', error);
      throw error;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CLEANUP
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
