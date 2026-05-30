import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MATERIAL } from '../../../shared/material/materials';
import {
  ComponentType, CalculationType, ComponentCategory,
  DeductionNature, PayFrequency, SalaryComponent
} from '../../../core/models/payroll.models';
import { Subject } from 'rxjs';

export interface SalaryComponentDialogData {
  mode: 'create' | 'edit' | 'view';
  componentType: ComponentType;
  component?: SalaryComponent;
}

@Component({
  selector: 'app-salary-component-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MATERIAL],
  templateUrl: './salary-component-dialog.html',
  styleUrl: './salary-component-dialog.scss',
})
export class SalaryComponentDialog implements OnInit {
  private fb = inject(FormBuilder);
  public dialogRef = inject(MatDialogRef<SalaryComponentDialog>);
  public data = inject<SalaryComponentDialogData>(MAT_DIALOG_DATA);

  form!: FormGroup;
  loading = signal(false);
  activeStep = signal(0);

  /** Emits form data when user clicks save — parent controls when to close */
  saveRequested = new Subject<{ action: string; data: any }>();

  isEditMode = computed(() => this.data.mode === 'edit');
  isViewMode = computed(() => this.data.mode === 'view');
  isCreateMode = computed(() => this.data.mode === 'create');

  calculationType = signal<CalculationType>('fixed');

  readonly componentCategories: { value: ComponentCategory; label: string }[] = [
    { value: 'fixed', label: 'Fixed' },
    { value: 'variable', label: 'Variable' },
  ];

  readonly calculationTypes: { value: CalculationType; label: string; icon: string }[] = [
    { value: 'fixed', label: 'Fixed Amount', icon: 'payments' },
    { value: 'percentage_of_basic', label: '% of Basic', icon: 'percent' },
    { value: 'formula', label: 'Formula', icon: 'functions' },
  ];

  readonly deductionNatures: { value: DeductionNature; label: string }[] = [
    { value: 'statutory', label: 'Statutory' },
    { value: 'non_statutory', label: 'Non-Statutory' },
  ];

  readonly payFrequencies: { value: PayFrequency; label: string }[] = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  readonly steps = computed(() => {
    const base = ['Basic Information', 'Calculation Setup'];
    if (this.data.componentType === 'EARNINGS' || this.data.componentType === 'DEDUCTIONS') {
      base.push('Tax & Statutory');
    }
    base.push('Display & Payslip');
    if (this.data.componentType === 'DEDUCTIONS') {
      base.splice(2, 0, 'Contribution Settings');
    }
    if (this.data.componentType === 'REIMBURSEMENTS') {
      base.splice(2, 0, 'Reimbursement Rules');
    }
    if (this.data.componentType === 'VARIABLE_PAY') {
      base.splice(2, 0, 'Variable Pay Config');
    }
    return base;
  });

  get dialogTitle(): string {
    const modeLabel = this.isCreateMode() ? 'Add New' : this.isEditMode() ? 'Edit' : 'View';
    const typeLabel: Record<ComponentType, string> = {
      EARNINGS: 'Earning',
      DEDUCTIONS: 'Deduction',
      REIMBURSEMENTS: 'Reimbursement',
      VARIABLE_PAY: 'Variable Pay',
    };
    return `${modeLabel} ${typeLabel[this.data.componentType]} Component`;
  }

  get dialogIcon(): string {
    const icons: Record<ComponentType, string> = {
      EARNINGS: 'trending_up',
      DEDUCTIONS: 'trending_down',
      REIMBURSEMENTS: 'receipt_long',
      VARIABLE_PAY: 'stars',
    };
    return icons[this.data.componentType];
  }

  get dialogColor(): string {
    const colors: Record<ComponentType, string> = {
      EARNINGS: '#16a34a',
      DEDUCTIONS: '#dc2626',
      REIMBURSEMENTS: '#2563eb',
      VARIABLE_PAY: '#9333ea',
    };
    return colors[this.data.componentType];
  }

  ngOnInit(): void {
    this.buildForm();
    if (this.data.component) {
      this.form.patchValue(this.data.component);
      this.calculationType.set(this.data.component.calculation_type);
    }
    if (this.isViewMode()) {
      this.form.disable();
    }
    this.form.get('calculation_type')?.valueChanges.subscribe((val: CalculationType) => {
      this.calculationType.set(val);
      this.updateConditionalValidators();
    });
  }

  private buildForm(): void {
    // Base fields common to all tabs
    const baseGroup: Record<string, any> = {
      component_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      component_code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_]+$/)]],
      description: [''],
      component_category: ['fixed', Validators.required],
      calculation_type: ['fixed', Validators.required],
      fixed_amount: [null],
      percentage: [null],
      formula: [''],
      taxable: [false],
      pf_applicable: [false],
      esi_applicable: [false],
      professional_tax_applicable: [false],
      show_in_payslip: [true],
      pro_rated: [false],
      include_in_ctc: [true],
      effective_from: [new Date(), Validators.required],
      status: ['ACTIVE', Validators.required],
    };

    // Type-specific fields
    if (this.data.componentType === 'EARNINGS') {
      baseGroup['is_basic'] = [false];
    }

    if (this.data.componentType === 'DEDUCTIONS') {
      baseGroup['deduction_nature'] = ['non_statutory', Validators.required];
      baseGroup['employer_contribution'] = [false];
      baseGroup['employee_contribution'] = [true];
      baseGroup['max_cap'] = [null];
    }

    if (this.data.componentType === 'REIMBURSEMENTS') {
      baseGroup['claim_based'] = [false];
      baseGroup['attachment_required'] = [false];
      baseGroup['approval_required'] = [true];
      baseGroup['max_limit_per_month'] = [null];
    }

    if (this.data.componentType === 'VARIABLE_PAY') {
      baseGroup['pay_frequency'] = ['monthly', Validators.required];
      baseGroup['linked_to_kpi'] = [false];
      baseGroup['auto_calculate'] = [false];
      baseGroup['manual_override'] = [true];
    }

    this.form = this.fb.group(baseGroup);
    this.updateConditionalValidators();
  }

  private updateConditionalValidators(): void {
    const calcType = this.form.get('calculation_type')?.value;
    const fixedCtrl = this.form.get('fixed_amount');
    const pctCtrl = this.form.get('percentage');
    const formulaCtrl = this.form.get('formula');

    fixedCtrl?.clearValidators();
    pctCtrl?.clearValidators();
    formulaCtrl?.clearValidators();

    if (calcType === 'fixed') {
      fixedCtrl?.setValidators([Validators.required, Validators.min(0)]);
    } else if (calcType === 'percentage_of_basic') {
      pctCtrl?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
    } else if (calcType === 'formula') {
      formulaCtrl?.setValidators([Validators.required, this.formulaValidator]);
    }

    fixedCtrl?.updateValueAndValidity();
    pctCtrl?.updateValueAndValidity();
    formulaCtrl?.updateValueAndValidity();
  }

  formulaValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    // Allow letters, digits, operators, parentheses, commas, %, decimal points, spaces
    const validPattern = /^[A-Z_a-z0-9\s+\-*/().,% ]+$/;
    if (!validPattern.test(value)) {
      return { invalidFormula: 'Formula contains invalid characters' };
    }
    const open = (value.match(/\(/g) || []).length;
    const close = (value.match(/\)/g) || []).length;
    if (open !== close) {
      return { invalidFormula: 'Unbalanced parentheses' };
    }
    return null;
  }

  autoGenerateCode(): void {
    const name = this.form.get('component_name')?.value;
    if (name && this.isCreateMode()) {
      const code = name
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 20);
      this.form.get('component_code')?.setValue(code);
    }
  }

  nextStep(): void {
    if (this.activeStep() < this.steps().length - 1) {
      this.activeStep.update(v => v + 1);
    }
  }

  prevStep(): void {
    if (this.activeStep() > 0) {
      this.activeStep.update(v => v - 1);
    }
  }

  goToStep(index: number): void {
    this.activeStep.set(index);
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formData = this.form.getRawValue();
    formData.component_type = this.data.componentType;

    // Clean irrelevant fields based on calculation_type
    if (formData.calculation_type === 'fixed') {
      formData.percentage = null;
      formData.formula = null;
    } else if (formData.calculation_type === 'percentage') {
      formData.fixed_amount = null;
      formData.formula = null;
    } else if (formData.calculation_type === 'formula') {
      formData.fixed_amount = null;
      formData.percentage = null;
    }

    this.saveRequested.next({ action: this.data.mode, data: formData });
  }

  close(): void {
    this.dialogRef.close(null);
  }

  insertFormulaToken(token: string): void {
    const currentFormula = this.form.get('formula')?.value || '';
    this.form.get('formula')?.setValue(currentFormula + token);
  }
}
