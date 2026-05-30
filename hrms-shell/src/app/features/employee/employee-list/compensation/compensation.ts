import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MATERIAL } from '../../../../shared/material/materials';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiClient } from '../../../../core/services/api-client.service';
import { API_ENDPOINTS } from '../../../../core/config/api-endpoints';
import { Subject, takeUntil } from 'rxjs';
@Component({
  selector: 'app-compensation',
  imports: [MATERIAL, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './compensation.html',
  styleUrl: './compensation.scss',
})
export class Compensation implements OnInit {
  private fb = inject(FormBuilder);
  private _httpClient = inject(ApiClient);
  private _route = inject(ActivatedRoute);

  id!: string;
  destroy$ = new Subject<void>();
  compensationDetails: FormGroup = this.fb.group({
    annualCtc: [600000, Validators.required],
    // New Fields
    payStructure: ['MONTHLY', Validators.required],
    currency: ['INR', Validators.required],
    effectiveFrom: [new Date(), Validators.required],
    // Earnings
    basicSalary: [{ value: 0, disabled: true }],
    hra: [{ value: 0, disabled: true }],
    specialAllowance: [{ value: 0, disabled: true }],
    grossSalary: [{ value: 0, disabled: true }], // Monthly Gross
    allowances: this.fb.array([]),
    // Deductions
    pfDeduction: [{ value: 0, disabled: true }],
    profTax: [{ value: 200, disabled: true }],
    totalDeductions: [{ value: 0, disabled: true }],
    netSalary: [{ value: 0, disabled: true }]
  });

  get allowances(): FormArray {
    return this.compensationDetails.get('allowances') as FormArray;
  }

  ngOnInit(): void {
    this.id = this._route.snapshot.paramMap.get('id')!;
    if (this.id) {
      this.getCompensationDetails();
    }
  }

  getCompensationDetails() {
    const apiUrl = `${API_ENDPOINTS.employee.getCompensation}/${this.id}`;
    this._httpClient.get(apiUrl).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          const data = res.data;

          // Clear existing allowances
          this.allowances.clear();

          // Populate allowances FormArray
          if (data.allowances && Array.isArray(data.allowances)) {
            data.allowances.forEach((al: any) => {
              this.allowances.push(this.fb.group({
                name: [al.name, Validators.required],
                amount: [al.amount, [Validators.required, Validators.min(0)]],
                confirmed: [true] // Assume existing ones are confirmed
              }));
            });
          }

          // Extract PF and PT from deductions if stored as array
          let pf = 0;
          let pt = 200;
          if (data.deductions && Array.isArray(data.deductions)) {
            const pfObj = data.deductions.find((d: any) => d.name === 'PF');
            const ptObj = data.deductions.find((d: any) => d.name === 'Professional Tax');
            if (pfObj) pf = pfObj.amount;
            if (ptObj) pt = ptObj.amount;
          }

          // Patch form
          this.compensationDetails.patchValue({
            annualCtc: data.ctc,
            payStructure: data.pay_structure,
            currency: data.currency,
            effectiveFrom: data.effective_from ? new Date(data.effective_from) : new Date(),
            basicSalary: data.basic,
            hra: data.hra,
            specialAllowance: data.special_allowance,
            grossSalary: data.gross_salary,
            pfDeduction: pf,
            profTax: pt,
            totalDeductions: data.total_deductions,
            netSalary: data.net_salary
          }, { emitEvent: false });
        }
      },
      error: (err) => {
        console.error('Error fetching compensation details:', err);
      }
    });
  }

  constructor() {
    // Auto-calculate Salary Breakup when CTC changes
    this.compensationDetails.get('annualCtc')?.valueChanges.subscribe(ctc => {
      this.calculateSalaryBreakup(ctc);
    });

    // Recalculate when allowances change
    this.allowances.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const ctc = this.compensationDetails.get('annualCtc')?.value;
      this.calculateSalaryBreakup(ctc);
    });

    // Initial Calc
    this.calculateSalaryBreakup(600000);
  }

  addAllowance() {
    this.allowances.push(this.fb.group({
      name: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      confirmed: [false]
    }));
  }

  confirmAllowance(index: number) {
    const control = this.allowances.at(index);
    if (control.valid) {
      control.get('confirmed')?.setValue(true);
    } else {
      control.markAllAsTouched();
    }
  }

  removeAllowance(index: number) {
    this.allowances.removeAt(index);
  }

  // --- LOGIC: Salary Calculation ---
  calculateSalaryBreakup(ctc: number) {
    if (!ctc) return;

    const monthlyGross = ctc / 12;
    const basic = monthlyGross * 0.40; // 40% of Gross
    const hra = basic * 0.50; // 50% of Basic

    // Sum custom allowances
    const customAllowancesTotal = this.allowances.controls.reduce((acc, control) => {
      return acc + (Number(control.get('amount')?.value) || 0);
    }, 0);

    let special = monthlyGross - (basic + hra + customAllowancesTotal); // Balancing figure

    if (special < 0) {
      special = 0;
      // Ideally show warning that Allowances exceed CTC structure
    }

    const pf = basic * 0.12; // 12% of Basic
    const pt = 200; // Flat PT (Example)
    const totalDeductions = pf + pt;
    const net = monthlyGross - totalDeductions;

    this.compensationDetails.patchValue({
      basicSalary: Math.round(basic),
      hra: Math.round(hra),
      specialAllowance: Math.round(special),
      grossSalary: Math.round(monthlyGross),
      pfDeduction: Math.round(pf),
      profTax: pt,
      totalDeductions: Math.round(totalDeductions),
      netSalary: Math.round(net)
    }, { emitEvent: false });
  }

  save() {
    if (this.compensationDetails.invalid) {
      this.compensationDetails.markAllAsTouched();
      return;
    }
    const formValues = this.compensationDetails.getRawValue();
    const payload = {
      employee_uuid: this.id,
      pay_structure: (formValues.payStructure).toUpperCase(),
      currency: formValues.currency || "INR",
      basic: formValues.basicSalary,
      hra: formValues.hra,
      special_allowance: formValues.specialAllowance,
      allowances: formValues.allowances || [],
      deductions: [
        { name: 'PF', amount: formValues.pfDeduction },
        { name: 'Professional Tax', amount: formValues.profTax }
      ],
      gross_salary: formValues.grossSalary,
      total_deductions: formValues.totalDeductions,
      net_salary: formValues.netSalary,
      ctc: formValues.annualCtc,
      effective_from: formValues.effectiveFrom
    };
    console.log('Compensation Payload:', payload);
    this._httpClient.post(API_ENDPOINTS.employee.saveCompensation, payload).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          console.log('Compensation saved:', res);
          // Show success message
        },
        error: (err) => {
          console.error('Error saving compensation:', err);
        }
      });
  }
}
