import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SubscriptionPlan, ApiResponse } from '../../../../core/models/subscription-plan.model';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MATERIAL } from '../../../../shared/material/materials';
import { ApiClient } from '../../../../core/services/api-client.service';
import { API_ENDPOINTS } from '../../../../core/config/api-endpoints';
import { CommonService } from '../../../../core/services/common.service';

@Component({
  selector: 'app-subscription-plan-create',
  imports: [MATERIAL, CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './subscription-plan-create.html',
  styleUrl: './subscription-plan-create.scss',
})
export class SubscriptionPlanCreate implements OnInit {

  private utils = inject(CommonService);
  private _httpClient = inject(ApiClient);
  private _router = inject(Router);
  private _route = inject(ActivatedRoute)
  private _fb = inject(FormBuilder);
  private _toastr = inject(ToastrService)

  // Reactive Form
  planForm!: FormGroup;
  destroy$ = new Subject<void>();
  private planId!: string

  ngOnInit(): void {
    this.planId = this._route.snapshot.paramMap.get('id')!;
    if (this.planId) {
      this.get_plan_details();
    }
    this.initializeForm();
  }

  // Initialize reactive form with validation
  initializeForm(): void {
    this.planForm = this._fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      plan_code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_]+$/)]],
      monthlyPrice: [0, [Validators.required, Validators.min(1)]],
      yearlyPrice: [0, [Validators.required, Validators.min(1)]],
      employeeLimit: [0, [Validators.required, Validators.min(1)]],
      storageLimit: [0, [Validators.required, Validators.min(1)]],
      modules: this._fb.group({
        recruitment: [false],
        onboarding: [false],
        payroll: [false],
        performance: [false],
        learning: [false]
      })
    });
  }

  // Get Plan Details API Call
  get_plan_details() {
    const payload = {
      plan_id: this.planId
    }
    this._httpClient.post(API_ENDPOINTS.subscription.get_plan_by_id, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (_res: any) => {
        console.log(_res);
        const data = _res.data;
        this.planForm.patchValue({
          name: data.plan_name,
          plan_code: data.plan_code,
          monthlyPrice: data.pricing?.monthly_price,
          yearlyPrice: data.pricing?.yearly_price,
          employeeLimit: data.limits?.employee_limit,
          storageLimit: data.limits?.storage_limit_gb,
          modules: {
            recruitment: data.modules?.recruitment,
            onboarding: data.modules?.onboarding,
            payroll: data.modules?.payroll,
            performance: data.modules?.performance,
            learning: data.modules?.learning
          }
        });
      },
      error: () => {

      }
    })
  }


  //  Get modules form group
  get modules() {
    return this.planForm.get('modules') as FormGroup;
  }

  // Check if at least one module is selected
  isAtLeastOneModuleSelected(): boolean {
    return Object.values(this.modules.value).some((value: any) => value === true);
  }

  //  Create subscription plan
  createPlan(): void {
    if (!this.planForm.valid) {
      return;
    }
    if (!this.isAtLeastOneModuleSelected()) {
      return;
    }
    const data = this.planForm.value;
    const payload: any = {
      "plan_name": data?.name,
      "plan_code": data?.plan_code,
      "monthlyPrice": data?.monthlyPrice,
      "yearlyPrice": data?.yearlyPrice,
      "employeeLimit": data?.employeeLimit,
      "storageLimit": data?.storageLimit,
      "modules": data.modules
    }
    if (this.planId) {
      payload['plan_id'] = this.planId
    }
    this._httpClient.post<ApiResponse<SubscriptionPlan>>(API_ENDPOINTS.subscription.create_plan, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (_res: any) => {
        console.log('Plan created:', _res.data);
        this._toastr.success(_res.msg)
        setTimeout(() => {
          this._router.navigate(['/home/paltform-management/subscription-plan/subscription-plan-list']);
        }, 2000);
      },
      error: (error) => {
        console.error('Error creating plan:', error);
      }
    });
  }

  // Reset form to initial state
  resetForm(): void {
    this.planForm.reset({
      name: '',
      plan_code: '',
      monthlyPrice: 0,
      yearlyPrice: 0,
      employeeLimit: 0,
      storageLimit: 0,
      modules: {
        recruitment: false,
        onboarding: false,
        payroll: false,
        performance: false,
        learning: false
      }
    });
  }
}
