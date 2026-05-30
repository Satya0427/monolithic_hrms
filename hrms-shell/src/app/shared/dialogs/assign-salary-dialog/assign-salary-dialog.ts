import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MATERIAL } from '../../../shared/material/materials';
import { ApiClient } from '../../../core/services/api-client.service';
import { API_ENDPOINTS } from '../../../core/config/api-endpoints';
import { Subject, takeUntil } from 'rxjs';
import { EmployeeAssignmentRecord, EarningSnapshot, DeductionSnapshot } from '../../../features/payroll_module/payroll-structure/employee-assignment/employee-assignment';


export interface AssignSalaryDialogData {
    mode: 'create' | 'edit' | 'revise' | 'view';
    assignment?: EmployeeAssignmentRecord;
}

interface EmployeeOption {
    id: string;
    employee_id: string;   // e.g. "ATPL00024"
    name: string;
}

interface TemplateOption {
    _id: string;
    template_name: string;
    template_code: string;
    status: string;
    earnings: any[];
    deductions: any[];
}

@Component({
    selector: 'app-assign-salary-dialog',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, MATERIAL],
    templateUrl: './assign-salary-dialog.html',
    styleUrl: './assign-salary-dialog.scss',
})
export class AssignSalaryDialog implements OnInit, OnDestroy {
    private _fb = inject(FormBuilder);
    private _httpClient = inject(ApiClient);
    public dialogRef = inject(MatDialogRef<AssignSalaryDialog>);
    public data = inject<AssignSalaryDialogData>(MAT_DIALOG_DATA);
    private destroy$ = new Subject<void>();

    loading = signal(false);
    activeStep = signal(0);

    /** Emits payload when user clicks save — parent controls close */
    saveRequested = new Subject<{ action: string; data: any }>();

    isViewMode = computed(() => this.data.mode === 'view');
    isReviseMode = computed(() => this.data.mode === 'revise');
    isEditMode = computed(() => this.data.mode === 'edit');
    isCreateMode = computed(() => this.data.mode === 'create');

    dialogTitle = computed(() => {
        switch (this.data.mode) {
            case 'create': return 'Assign Salary';
            case 'edit': return 'Edit Salary Assignment';
            case 'revise': return 'Revise Salary';
            case 'view': return 'Salary Details';
        }
    });

    steps = computed(() => {
        if (this.isViewMode()) {
            return [
                { label: 'Assignment Info', icon: 'person' },
                { label: 'Earnings', icon: 'trending_up' },
                { label: 'Deductions', icon: 'trending_down' },
                { label: 'Summary', icon: 'summarize' },
            ];
        }
        return [
            { label: 'Basic Info', icon: 'person' },
            { label: 'Earnings', icon: 'trending_up' },
            { label: 'Deductions', icon: 'trending_down' },
            { label: 'Preview', icon: 'preview' },
        ];
    });

    // ─── STEP 1: Basic Assignment Info ───
    basicForm: FormGroup = this._fb.group({
        employee_id: ['', Validators.required],
        template_id: ['', Validators.required],
        annual_ctc: [0, [Validators.required, Validators.min(1)]],
        effective_from: [null, Validators.required],
        payroll_start_month: [null],
        status: ['ACTIVE'],
    });

    monthlyGross = computed(() => Math.round(this.annualCtc() / 12));
    annualCtc = signal<number>(0);

    // Dropdowns
    employees = signal<EmployeeOption[]>([]);
    templates = signal<TemplateOption[]>([]);
    selectedEmployee = signal<EmployeeOption | null>(null);
    selectedTemplate = signal<TemplateOption | null>(null);

    // ─── STEP 2: Earnings Snapshot ───
    earningsSnapshot = signal<EarningSnapshot[]>([]);

    // ─── STEP 3: Deductions Snapshot ───
    deductionsSnapshot = signal<DeductionSnapshot[]>([]);

    // ─── STEP 4: Preview Computed Values ───
    totalMonthlyEarnings = computed(() => this.earningsSnapshot().reduce((s, e) => s + e.monthly_value, 0));
    totalAnnualEarnings = computed(() => this.earningsSnapshot().reduce((s, e) => s + e.annual_value, 0));
    totalMonthlyDeductions = computed(() => this.deductionsSnapshot().reduce((s, d) => s + d.monthly_value, 0));
    netMonthlySalary = computed(() => this.totalMonthlyEarnings() - this.totalMonthlyDeductions());
    netAnnualSalary = computed(() => (this.totalMonthlyEarnings() - this.totalMonthlyDeductions()) * 12);

    ngOnInit(): void {
        if (!this.isViewMode()) {
            this.loadEmployees();
            this.loadTemplates();
        }

        // Populate for edit/revise/view
        if (this.data.assignment) {
            this.patchAssignment(this.data.assignment);
        }
    }

    // ─── Load Employees Dropdown ───
    loadEmployees(): void {
        this._httpClient.get(API_ENDPOINTS.dropdown.employees).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response: any) => {
                const list = response?.data || response || [];
                this.employees.set(list);
            },
            error: (err) => console.error('Error loading employees:', err)
        });
    }

    // ─── Load Templates Dropdown ───
    loadTemplates(): void {
        const payload = {
            search: null,
        };
        this._httpClient.post(API_ENDPOINTS.payroll.get_template_for_assignment, payload).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response: any) => {
                const list = response?.data?.templates || response?.data || [];
                this.templates.set(list);
            },
            error: (err) => console.error('Error loading templates:', err)
        });
    }

    // ─── Patch data for edit/revise/view ───
    patchAssignment(assignment: EmployeeAssignmentRecord): void {
        this.basicForm.patchValue({
            employee_id: assignment.employee_id,
            template_id: assignment.template_id,
            annual_ctc: assignment.annual_ctc,
            effective_from: assignment.effective_from ? new Date(assignment.effective_from as string) : null,
            status: assignment.status,
        });

        this.annualCtc.set(assignment.annual_ctc || 0);

        if (assignment.earnings_snapshot?.length) {
            this.earningsSnapshot.set(assignment.earnings_snapshot);
        }
        if (assignment.deductions_snapshot?.length) {
            this.deductionsSnapshot.set(assignment.deductions_snapshot);
        }

        // For revise mode, clear effective_from to force new date
        if (this.isReviseMode()) {
            this.basicForm.get('effective_from')?.setValue(null);
        }

        // For edit/view, disable employee selection
        if (this.isEditMode() || this.isViewMode()) {
            this.basicForm.get('employee_id')?.disable();
        }
    }

    // ─── Template Selection Changed ───
    onTemplateChange(templateId: string): void {
        const template = this.templates().find(t => t._id === templateId);
        this.selectedTemplate.set(template || null);
        if (template && this.annualCtc() > 0) {
            this.computeEarningsFromTemplate(template);
            this.computeDeductionsFromTemplate(template);
        }
    }

    // ─── Employee Selection Changed ───
    onEmployeeChange(employeeId: string): void {
        const emp = this.employees().find(e => e.id === employeeId);
        this.selectedEmployee.set(emp || null);
    }

    // ─── CTC Changed ───
    onCtcChange(value: number): void {
        this.annualCtc.set(value || 0);
        const template = this.selectedTemplate() || this.templates().find(t => t._id === this.basicForm.get('template_id')?.value);
        if (template) {
            this.computeEarningsFromTemplate(template);
            this.computeDeductionsFromTemplate(template);
        }
    }

    // ─── Normalize nested component_id objects from API ───
    private normalizeEarnings(earnings: any[]): any[] {
        return earnings.map(e => {
            const comp = typeof e.component_id === 'object' ? e.component_id : null;
            return {
                ...e,
                component_id: comp ? comp._id : e.component_id,
                component_name: comp?.component_name || e.component_name || '',
                component_code: comp?.component_code || e.component_code || '',
                is_basic: comp?.is_basic ?? e.is_basic ?? false,
                calculation_type: comp?.calculation_type || e.calculation_type || '',
                formula: e.formula || comp?.formula || '',
                // employee_contribution: comp?.employee_contribution ?? e.employee_contribution ?? false,
                // employer_contribution: comp?.employer_contribution ?? e.employer_contribution ?? false,
            };
        });
    }

    private normalizeDeductions(deductions: any[]): any[] {
        return deductions.map(d => {
            const comp = typeof d.component_id === 'object' ? d.component_id : null;
            return {
                ...d,
                component_id: comp ? comp._id : d.component_id,
                component_name: comp?.component_name || d.component_name || '',
                component_code: comp?.component_code || d.component_code || '',
                deduction_nature: comp?.deduction_nature || d.deduction_nature || '',
                calculation_type: comp?.calculation_type || d.calculation_type || 'fixed',
                formula: d.formula || comp?.formula || '',
                employee_contribution: comp?.employee_contribution ?? d.employee_contribution ?? false,
                employer_contribution: comp?.employer_contribution ?? d.employer_contribution ?? false,
            };
        });
    }

    // ─── Compute Earnings from Template ───
    computeEarningsFromTemplate(template: TemplateOption): void {
        const ctc = this.annualCtc();
        if (!ctc || !template.earnings?.length) return;

        const earnings = this.normalizeEarnings(template.earnings);
        const resolved: Record<string, number> = { GROSS: ctc };

        // Pass 1: Fixed
        for (const e of earnings) {
            const vt = e.value_type || (e.calculation_type === 'formula' ? 'formula' : e.calculation_type === 'percentage_of_basic' ? 'percentage' : 'fixed');
            if (vt === 'fixed') {
                resolved[e.component_code || ''] = (e.fixed_amount || 0) * 12;
            }
        }

        // Pass 2: Formula (e.g. BASIC = GROSS * 0.50)
        for (const e of earnings) {
            const vt = e.value_type || (e.calculation_type === 'formula' ? 'formula' : e.calculation_type === 'percentage_of_basic' ? 'percentage' : 'fixed');
            if (vt === 'formula' && e.formula) {
                resolved[e.component_code || ''] = this.evaluateFormula(e.formula, resolved);
            }
        }

        // Pass 3: Percentage of Basic
        for (const e of earnings) {
            const vt = e.value_type || (e.calculation_type === 'formula' ? 'formula' : e.calculation_type === 'percentage_of_basic' ? 'percentage' : 'fixed');
            if (vt === 'percentage') {
                const basicAnnual = resolved['BASIC'] || 0;
                resolved[e.component_code || ''] = basicAnnual * (e.percentage || 0) / 100;
            }
        }

        const snapshots: EarningSnapshot[] = earnings.map(e => {
            const vt = e.value_type || (e.calculation_type === 'formula' ? 'formula' : e.calculation_type === 'percentage_of_basic' ? 'percentage' : 'fixed');
            const annual = resolved[e.component_code || ''] || 0;
            return {
                component_id: e.component_id,
                component_code: e.component_code || '',
                component_name: e.component_name || '',
                value_type: vt,
                fixed_amount: vt === 'fixed' ? (e.fixed_amount || 0) : null,
                percentage: vt === 'percentage' ? (e.percentage || 0) : null,
                formula: vt === 'formula' ? (e.formula || '') : null,
                monthly_value: Math.round(annual / 12),
                annual_value: Math.round(annual),
                override_allowed: e.override_allowed ?? false,
            };
        });
        this.earningsSnapshot.set(snapshots);
    }

    // ─── Compute Deductions from Template ───
    computeDeductionsFromTemplate(template: TemplateOption): void {
        if (!template.deductions?.length) {
            this.deductionsSnapshot.set([]);
            return;
        }
        const deductions = this.normalizeDeductions(template.deductions);
        const resolvedAnnual: Record<string, number> = { GROSS: this.annualCtc() };
        for (const e of this.earningsSnapshot()) {
            if (e.component_code) {
                resolvedAnnual[e.component_code] = e.annual_value || 0;
            }
        }
        const basicMonthly = this.earningsSnapshot().find(e => e.component_code === 'BASIC')?.monthly_value || 0;

        const snapshots: DeductionSnapshot[] = deductions.map(d => {
            // Calculate actual monthly deduction amount
            let monthlyAmount = 0;
            const calcType = d.calculation_type || 'fixed';

            if (calcType === 'fixed' && d.fixed_amount) {
                monthlyAmount = d.fixed_amount;
            } else if (calcType === 'percentage_of_basic' && d.percentage) {
                monthlyAmount = Math.round(basicMonthly * d.percentage / 100);
            } else if (calcType === 'formula' && d.formula) {
                const annualAmount = this.evaluateFormula(d.formula, resolvedAnnual);
                monthlyAmount = Math.round(annualAmount / 12);
            }

            // API returns booleans — convert to actual amounts
            const hasEmployer = d?.employer_contribution === true || d?.employer_contribution === 'true';
            const hasEmployee = d?.employee_contribution === true || d?.employee_contribution === 'true';

            return {
                component_id: d.component_id,
                component_code: d.component_code || '',
                component_name: d.component_name || '',
                calculation_type: calcType,
                percentage: d.percentage || null,
                fixed_amount: d.fixed_amount || null,
                employer_contribution: hasEmployer ? monthlyAmount : 0,
                employee_contribution: hasEmployee ? monthlyAmount : 0,
                monthly_value: hasEmployee ? monthlyAmount : 0,
                value_type: calcType === 'formula' ? 'formula' : calcType === 'percentage_of_basic' ? 'percentage' : 'fixed',
            };
        });
        this.deductionsSnapshot.set(snapshots);
    }

    // ─── Override earning value ───
    updateEarningOverride(index: number, field: 'monthly_value' | 'annual_value', value: number): void {
        this.earningsSnapshot.update(items => {
            const updated = [...items];
            if (field === 'monthly_value') {
                updated[index] = { ...updated[index], monthly_value: value, annual_value: value * 12 };
            } else {
                updated[index] = { ...updated[index], annual_value: value, monthly_value: Math.round(value / 12) };
            }
            return updated;
        });
    }

    // ─── Formula Evaluation ───
    private evaluateFormula(formula: string, resolved: Record<string, number>): number {
        try {
            let expression = formula.trim();
            const sortedKeys = Object.keys(resolved).sort((a, b) => b.length - a.length);
            for (const key of sortedKeys) {
                if (key) {
                    const regex = new RegExp(`\\b${key}\\b`, 'g');
                    expression = expression.replace(regex, String(resolved[key] || 0));
                }
            }
            expression = expression.replace(/%/g, '/100');
            expression = expression.replace(/\bMIN\b/gi, 'Math.min');
            expression = expression.replace(/\bMAX\b/gi, 'Math.max');
            expression = expression.replace(/\bROUND\b/gi, 'Math.round');
            if (!/^[\d\s+\-*/().,a-zA-Z]+$/.test(expression)) return 0;
            const result = Function(`"use strict"; return (${expression});`)();
            return typeof result === 'number' && isFinite(result) ? result : 0;
        } catch {
            return 0;
        }
    }

    // ─── Navigation ───
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

    // ─── Validation ───
    canProceedStep1(): boolean {
        return this.basicForm.valid && this.annualCtc() > 0;
    }

    canProceedStep2(): boolean {
        return this.earningsSnapshot().length > 0 && this.earningsSnapshot().some(e => e.component_code === 'BASIC');
    }

    // ─── Submit ───
    onSubmit(): void {
        if (this.basicForm.invalid || this.loading()) {
            this.basicForm.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        const formData = this.basicForm.getRawValue();

        const payload = {
            employee_uuid: formData.employee_id,
            template_id: formData.template_id,
            annual_ctc: this.annualCtc(),
            monthly_gross: this.monthlyGross(),
            effective_from: formData.effective_from,
            payroll_start_month: formData.payroll_start_month || null,
            status: formData.status || 'ACTIVE',
            earnings_snapshot: this.earningsSnapshot().map(e => ({
                component_id: e.component_id,
                component_code: e.component_code,
                component_name: e.component_name,
                value_type: e.value_type,
                fixed_amount: e.fixed_amount,
                percentage: e.percentage,
                formula: e.formula,
                monthly_value: e.monthly_value,
                annual_value: e.annual_value,
                override_allowed: e.override_allowed,
            })),
            deductions_snapshot: this.deductionsSnapshot().map(d => ({
                component_id: d.component_id,
                component_code: d.component_code,
                component_name: d.component_name,
                calculation_type: d.calculation_type,
                percentage: d.percentage,
                fixed_amount: d.fixed_amount,
                employer_contribution: d.employer_contribution,
                employee_contribution: d.employee_contribution,
                monthly_value: d.monthly_value,
                value_type: d.value_type,
            })),
        };

        this.saveRequested.next({ action: this.data.mode, data: payload });
    }

    close(): void {
        this.dialogRef.close(null);
    }

    formatCurrency(val: number): string {
        if (!val && val !== 0) return '--';
        return '\u20B9' + val.toLocaleString('en-IN');
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
