import { Component, inject, signal, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MATERIAL } from '../../../../shared/material/materials';
import { CommonModule, Location } from '@angular/common';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { CommonService } from '../../../../core/services/common.service';
import { ApiClient } from '../../../../core/services/api-client.service';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { API_ENDPOINTS } from '../../../../core/config/api-endpoints';
import { ActivatedRoute, Router } from '@angular/router';
import { MatStepper } from '@angular/material/stepper';

@Component({
  selector: 'app-create-policy',
  imports: [MATERIAL, CommonModule, FormsModule, ReactiveFormsModule, PageHeader],
  templateUrl: './create-policy.html',
  styleUrl: './create-policy.scss',
})
export class CreatePolicy implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private _commonService = inject(CommonService);
  private _location = inject(Location);
  private _httpClient = inject(ApiClient);
  private _toastr = inject(ToastrService);
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  @ViewChild('stepper') stepper!: MatStepper;

  currentTab: string | number | null = null;
  pageTabs: any[] = [];
  saving = signal(false);
  currentStepIndex = signal(0);

  // Available Leave Types in the System
  availableLeaveTypes = signal<any[]>([]);
  employee_type = signal<any[]>([]);

  // Main Form Group
  policyForm: FormGroup = this.fb.group({
    basicInfo: this.fb.group({
      policyName: ['', Validators.required],
      description: [''],
      effectiveFrom: [new Date(), Validators.required],
      effectiveTo: [null],
      status: ['Draft', Validators.required]
    }),
    applicability: this.fb.group({
      employeeType: ['ALL', Validators.required],
      gender: ['All', Validators.required],
      maritalStatus: ['All', Validators.required],
      probation: [true],
      noticePeriod: [false]
    }),
    selectedLeaves: [[]], // Used to generate the Rule Blocks
    leaveRules: this.fb.array([]), // Dynamic Form Array
    sandwichRule: this.fb.group({
      isApplicable: [false],
      countWeeklyOffs: [false],
      countHolidays: [false]
    })
  });
  id!: string;


  async ngOnInit() {
    this.pageTabs = await this._commonService.getTabs('LEAVE_ADMIN')
    if (this.pageTabs.length > 0) {
      this.currentTab = this.pageTabs[1].key
    }
    this.id = this._route.snapshot.paramMap.get('id')!;
    
    // Load leave types first (will fetch policy details after types are loaded)
    this.fetchLeaveTypes();
    this.loadLookupData();
  }

  // =========== LOAD LOOKUP DATA FOR APPLICABILITY CRITERIA ============
  async loadLookupData() {
    const categories = API_ENDPOINTS.lookup.categories;
    const lookupData = await this._commonService.getBulkLookupData([
      categories.employee_type,
    ]);

    if (lookupData) {
      this.employee_type.set(lookupData[categories.employee_type] || []);
    }
  }

  // ========== API CALL TO FETCH ACTIVE LEAVE TYPES FOR SELECTION ============
  fetchLeaveTypes() {
    this._httpClient.get(API_ENDPOINTS.dropdown.leave_types).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const apiData = res?.data || [];
        const activeTypes = apiData.filter((item: any) => item.is_active !== false)
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            code: item.code
          }));
        this.availableLeaveTypes.set(activeTypes);
        
        // After leave types are loaded, fetch policy details if editing
        if (this.id) {
          this.fetchPolicyDetails();
        }
      },
      error: (err) => {
        console.error('Error fetching leave types:', err);
        this._toastr.error('Failed to load leave types');
      }
    });
  }


  // ========== GETTER FOR LEAVE RULES FORM ARRAY ============
  get leaveRulesArray() {
    return this.policyForm.get('leaveRules') as FormArray;
  }

  // ============ DYNAMIC LEAVE RULES BASED ON SELECTION ============
  onLeaveSelectionChange(selectedTypes: any[]) {
    this.leaveRulesArray.clear();

    selectedTypes.forEach(type => {
      // Create a FormGroup for EACH selected leave type
      const ruleGroup = this.fb.group({
        leaveTypeId: [type.id],
        leaveType: [type.name], // Display name
        accrual: this.fb.group({
          frequency: ['MONTHLY'],
          credit_amount: [1],
          max_balance: [12]
        }),
        restrictions: this.fb.group({
          max_per_month: [2],
          allow_half_day: [true],
          allow_negative_balance: [false]
        }),
        approval: this.fb.group({
          require_approval: [true],
          auto_approve: [false],
          document_required: [false]
        })
      });

      this.leaveRulesArray.push(ruleGroup);
    });
  }


  // ========= API Integration to Save Policy =======
  savePolicy() {
    if (!this.policyForm.valid) {
      this.policyForm.markAllAsTouched();
      this._toastr.warning('Please fill all required fields');
      return;
    }
    this.saving.set(true);
    const formValue = this.policyForm.value;
    // Construct single payload combining all steps
    const payload:any = {
      policy_name: formValue.basicInfo.policyName,
      description: formValue.basicInfo.description || '',
      effective_from: this.formatDate(formValue.basicInfo.effectiveFrom),
      effective_to: formValue.basicInfo.effectiveTo ? this.formatDate(formValue.basicInfo.effectiveTo) : null,
      status: formValue.basicInfo.status.toUpperCase(),
      applicability: {
        employee_type: formValue.applicability.employeeType.toUpperCase(),
        gender: formValue.applicability.gender.toUpperCase(),
        marital_status: formValue.applicability.maritalStatus.toUpperCase(),
        allow_during_probation: formValue.applicability.probation,
        allow_during_notice_period: formValue.applicability.noticePeriod
      },
      leave_rules: formValue.leaveRules.map((rule: any) => ({
        leave_type_id: rule.leaveTypeId,
        accrual: {
          frequency: rule.accrual.frequency,
          credit_amount: rule.accrual.credit_amount,
          max_balance: rule.accrual.max_balance
        },
        restrictions: {
          max_per_month: rule.restrictions.max_per_month,
          allow_half_day: rule.restrictions.allow_half_day,
          allow_negative_balance: rule.restrictions.allow_negative_balance
        },
        approval: {
          require_approval: rule.approval.require_approval,
          auto_approve: rule.approval.auto_approve,
          document_required: rule.approval.document_required
        }
      })),
      sandwich_rule: {
        enabled: formValue.sandwichRule.isApplicable
      }
    };

    if(this.id){
      payload['id'] = this.id; // Include ID for edit
    }
    // API Call
    this._httpClient.post(API_ENDPOINTS.leave.create_policy, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.saving.set(false);
        this._toastr.success('Leave Policy created successfully!');
        this._router.navigate(['/home/leave-management-module/leave-policy']);
      },
      error: (err) => {
        this.saving.set(false);
        console.error('Error saving policy:', err);
      }
    });
  }

  // ========= API CALL TO FETCH POLICY DETAILS FOR EDITING ============
  fetchPolicyDetails() {
    this._httpClient.post(API_ENDPOINTS.leave.get_policy_details, { id: this.id }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const policy = res?.data;
        if (!policy) return;

        this.policyForm.patchValue({
          basicInfo: {
            policyName: policy.policy_name,
            description: policy.description || '',
            effectiveFrom: new Date(policy.effective_from),
            effectiveTo: policy.effective_to ? new Date(policy.effective_to) : null,
            status: policy.status || 'ACTIVE'
          },
          applicability: {
            employeeType: policy.applicability?.employee_type || 'ALL',
            gender: policy.applicability?.gender || 'ALL',
            maritalStatus: policy.applicability?.marital_status || 'ALL',
            probation: policy.applicability?.allow_during_probation ?? true,
            noticePeriod: policy.applicability?.allow_during_notice_period ?? false
          },
          sandwichRule: {
            isApplicable: policy.sandwich_rule?.enabled ?? false,
            countWeeklyOffs: false,
            countHolidays: false
          }
        });

        if (policy.leave_rules?.length) {
          const selectedLeaves = policy.leave_rules.map((rule: any) => {
            const leaveType = this.availableLeaveTypes().find(lt => lt.id === rule.leave_type_id);
            return leaveType || { id: rule.leave_type_id, name: 'Unknown', code: 'N/A' };
          });

          this.policyForm.patchValue({ selectedLeaves });
          this.onLeaveSelectionChange(selectedLeaves);

          policy.leave_rules.forEach((rule: any, index: number) => {
            const ruleFormGroup = this.leaveRulesArray.at(index);
            if (ruleFormGroup) {
              ruleFormGroup.patchValue({
                accrual: {
                  frequency: rule.accrual?.frequency || 'MONTHLY',
                  credit_amount: rule.accrual?.credit_amount || 1,
                  max_balance: rule.accrual?.max_balance || 12
                },
                restrictions: {
                  max_per_month: rule.restrictions?.max_per_month || 2,
                  allow_half_day: rule.restrictions?.allow_half_day ?? true,
                  allow_negative_balance: rule.restrictions?.allow_negative_balance ?? false
                },
                approval: {
                  require_approval: rule.approval?.require_approval ?? true,
                  auto_approve: rule.approval?.auto_approve ?? false,
                  document_required: rule.approval?.document_required ?? false
                }
              });
            }
          });
        }
      },
      error: (err) => {
        console.error('Error fetching policy details:', err);
        this._toastr.error(err?.error?.message || 'Failed to fetch policy details');
      }
    });
  }

  // ========== HELPER TO FORMAT DATE TO YYYY-MM-DD ============
  private formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }


  handleBack() {
    this._location.back();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
