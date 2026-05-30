import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { MATERIAL } from '../../../../shared/material/materials';
import { ApiClient } from '../../../../core/services/api-client.service';
import { API_ENDPOINTS } from '../../../../core/config/api-endpoints';

@Component({
  selector: 'app-organization-create',
  imports: [MATERIAL, CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './organization-create.html',
  styleUrl: './organization-create.scss',
})
export class OrganizationCreate implements OnInit {
  private _apiClient = inject(ApiClient)
  private _fb = inject(FormBuilder)
  private _router = inject(Router)
  private _toastr = inject(ToastrService)
  private _route = inject(ActivatedRoute)

  plans = signal<any[]>([]);
  private destroy$ = new Subject<void>();
  private orgId!: string;

  // STEP 1: Organization Form
  organizationForm: FormGroup = this._fb.group({
    organization_name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    organization_code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(5)]],
    domain: ['', [Validators.required, Validators.maxLength(100)]],
    industry: ['', [Validators.maxLength(100)]],
    country: ['', [Validators.maxLength(50)]],
    company_size: [null, [Validators.min(1)]],
    status: ['TRIAL', [Validators.required]],
    address: ['', [Validators.maxLength(250)]]
  });

  // STEP 2
  // STEP 2: Subscription Form
  subscriptionForm = this._fb.group({
    subscription_plan_id: [null, [Validators.required]],
    employee_limit: [{ value: null, disabled: true }, [Validators.required, Validators.min(1)]],
    trial_days: [null, [Validators.min(1)]],
    plan_name: [null]
  });

  // STEP 3: Global Admin Form
  // globalAdminForm: FormGroup = this._fb.group({
  //   name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
  //   contact_email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
  //   contact_phone: ['', [Validators.maxLength(15)]]
  // });

  async ngOnInit() {
    this.orgId = this._route.snapshot.paramMap.get('id')!;
    await this.get_plans_data()
    if (this.orgId) {
      await this.getOrginiztionDetails();
    }
  }
  // Get API Call For Plans
  async get_plans_data() {
    const payload = {
      "page": "1",
      "limit": "10",
      "search_key": ""
    }
    this._apiClient.post(API_ENDPOINTS.subscription.get_all_plans, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (_res: any) => {
        const data = _res.data.plan_data;
        this.plans.set(
          data.map((e: any) => ({
            id: e._id,
            plan_name: e.plan_name,
            plan_code: e.plan_code,
            monthly_price: e.pricing?.monthly_price,
            yearly_price: e.pricing?.yearly_price,
            employee_limit: e.limits?.employee_limit
          }))
        );
      }, error: (_err: any) => {

      }, complete: () => {

      }
    })
  }

  // Create Orginization API Call
  createOrganization() {
    const organizationPayload = this.organizationForm.getRawValue();
    // const globalAdminPayload = this.globalAdminForm.getRawValue();
    const subscriptionPlanPayload = this.subscriptionForm.getRawValue();
    const payload: any = {
      "organization": organizationPayload,
      "subscription": subscriptionPlanPayload,
      // "global_admin": globalAdminPayload
    }
    if (this.orgId) payload['organizationId'] = this.orgId

    this._apiClient.post(API_ENDPOINTS.organizations.create, payload).subscribe({
      next: (_res: any) => {
        this._toastr.success(_res?.msg || 'Orginization created successfully');
        setTimeout(() => {
          this._router.navigate(['/home/paltform-management/orginization/orginization-list']);
        }, 300);
      },
      error: (err) => {
        console.error('Create organization failed', err);
      }
    });
  }

  // Get Orinization Details API Call
  async getOrginiztionDetails() {
    const payload = {
      "organizationId": this.orgId
    };

    this._apiClient.post(API_ENDPOINTS.organizations.get_by_id, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (_res: any) => {
        if (_res?.data) {
          const orgData = _res.data;

          // Populate Organization Form
          this.organizationForm.patchValue({
            organization_name: orgData.organization?.organization_name,
            domain: orgData.organization?.domain,
            industry: orgData.organization?.industry,
            country: orgData.organization?.country,
            company_size: orgData.organization?.company_size,
            status: orgData.is_active ? 'ACTIVE' : 'TRIAL',
            address: orgData.organization?.address || ''
          });

          // Populate Subscription Form
          this.subscriptionForm.patchValue({
            subscription_plan_id: orgData.subscription?.subscription_plan_id,
            trial_days: orgData.subscription?.trial_days,
            plan_name: orgData.subscription?.plan_name || ''
          });

          // Populate Global Admin Form
          // this.globalAdminForm.patchValue({
          //   name: orgData.global_admin?.name,
          //   contact_email: orgData.global_admin?.contact_email,
          //   contact_phone: orgData.global_admin?.contact_phone || ''
          // });
          const plan_id = this.subscriptionForm?.value?.subscription_plan_id || ''
          const idx = this.plans().findIndex(e => (e.id == plan_id))
          this.onPlanSelect(this.plans()[idx || 0]);
          console.log('Organization details loaded:', orgData);
          this._toastr.success('Organization details loaded successfully');
        }
      },
      error: (_err: any) => {
        console.error('Error fetching organization details:', _err);
        this._toastr.error('Failed to load organization details');
      },
      complete: () => {
        console.log('Organization details fetch completed');
      }
    });
  }


  onPlanSelect(plan: any) {
    this.subscriptionForm.patchValue({
      subscription_plan_id: plan.id,
      employee_limit: plan.employee_limit,
      plan_name: plan.plan_name
    });
  }

  // ===== REVIEW HELPERS =====

  // Organization
  get organizationReview() {
    return this.organizationForm.getRawValue();
  }
  get selectedPlanReview() {
    return this.subscriptionForm.getRawValue();
  }
  // Global Admin
  // get globalAdminReview() {
  //   return this.globalAdminForm.getRawValue();
  // }
}
