import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MATERIAL } from '../../../../shared/material/materials';
import { ApiClient } from '../../../../core/services/api-client.service';
import { API_ENDPOINTS } from '../../../../core/config/api-endpoints';

interface PlanUI {
  plan_name: string;
  plan_code: string;
  status: 'Active' | 'Inactive';
  monthlyPrice: number;
  yearlyPrice: number;
  employeeLimit: number;
  storageLimit: number;
  modules: {
    recruitment: boolean;
    onboarding: boolean;
    payroll: boolean;
    performance: boolean;
    learning: boolean;
  };
  createdOn: string;
}
@Component({
  selector: 'app-subscription-plan-view',
  imports: [RouterModule, CommonModule, MATERIAL],
  templateUrl: './subscription-plan-view.html',
  styleUrl: './subscription-plan-view.scss',
})
export class SubscriptionPlanView implements OnInit {
  private _route = inject(ActivatedRoute);
  private _httpClient = inject(ApiClient);

  private destroy$ = new Subject<void>()
  plan!: PlanUI
  planId!: string;

  ngOnInit(): void {
    this.planId = this._route.snapshot.paramMap.get('id')!;
    if (this.planId) {
      this.get_plan_details();
    }
  }

  // Get Plan Details API Call
  get_plan_details() {
    const payload = {
      plan_id: this.planId
    }
    this._httpClient.post(API_ENDPOINTS.subscription.get_plan_by_id, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (_res: any) => {
        console.log(_res);
        const apiData = _res.data;
        this.plan = {
          plan_name: apiData.plan_name,
          plan_code: apiData.plan_code,
          status: apiData.is_active ? 'Active' : 'Inactive',
          monthlyPrice: apiData.pricing?.monthly_price,
          yearlyPrice: apiData.pricing?.yearly_price,
          employeeLimit: apiData.limits?.employee_limit,
          storageLimit: apiData.limits?.storage_limit_gb,
          modules: {
            recruitment: apiData.modules?.recruitment,
            onboarding: apiData.modules?.onboarding,
            payroll: apiData.modules?.payroll,
            performance: apiData.modules?.performance,
            learning: apiData.modules?.learning
          },
          createdOn: apiData.createdAt
            ? new Date(apiData.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })
            : ''
        };
      },
      error: () => {

      }
    })
  }
}
