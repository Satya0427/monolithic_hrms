import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { MATERIAL } from '../../../../../shared/material/materials';
import { PageHeader, HeaderTab } from '../../../../../shared/components/page-header/page-header';
import { CommonService } from '../../../../../core/services/common.service';
import { ApiClient } from '../../../../../core/services/api-client.service';
import { API_ENDPOINTS } from '../../../../../core/config/api-endpoints';
import { ToastrService } from 'ngx-toastr';
import {
    PayrollTemplate, TemplateEarning, TemplateDeduction, CtcPreview
} from '../payroll-templates';

export interface AvailableComponent {
    _id: string;
    component_name: string;
    component_code: string;
    component_type: string;
    component_category: string;
    calculation_type: string;
    fixed_amount?: number;
    percentage?: number;
    formula?: string;
    taxable: boolean;
    pf_applicable: boolean;
    is_basic?: boolean;
    deduction_nature?: string;
    include_in_ctc: boolean;
    status: string;
}

@Component({
    selector: 'app-create-template',
    imports: [MATERIAL, CommonModule, FormsModule, ReactiveFormsModule, RouterModule, PageHeader],
    templateUrl: './create-template.html',
    styleUrl: './create-template.scss',
})
export class CreateTemplate implements OnInit, OnDestroy {
    private _fb = inject(FormBuilder);
    private _commonService = inject(CommonService);
    private _httpClient = inject(ApiClient);
    private _route = inject(ActivatedRoute);
    private _router = inject(Router);
    private _location = inject(Location);
    private _toastr = inject(ToastrService);
    private destroy$ = new Subject<void>();

    // Page header
    currentTab: string | number | null = null;
    pageTabs: any[] = [];
    templateId!: string;
    isEditMode = signal(false);

    // ─── STEP 1: Basic Information ───
    basicInfoForm: FormGroup = this._fb.group({
        template_name: ['', Validators.required],
        template_code: ['', Validators.required],
        description: [''],
        effective_from: [null, Validators.required],
        status: ['ACTIVE', Validators.required],
    });

    // ─── STEP 2: Earnings Configuration ───
    availableEarnings = signal<AvailableComponent[]>([]);
    selectedEarnings = signal<TemplateEarning[]>([]);
    earningsSearchQuery = signal('');

    filteredAvailableEarnings = computed(() => {
        const selected = this.selectedEarnings().map(e => e.component_id);
        let available = this.availableEarnings().filter(c => !selected.includes(c._id));
        const q = this.earningsSearchQuery().toLowerCase().trim();
        if (q) {
            available = available.filter(c =>
                c.component_name.toLowerCase().includes(q) ||
                c.component_code.toLowerCase().includes(q)
            );
        }
        return available;
    });

    // ─── STEP 3: Deductions Configuration ───
    availableDeductions = signal<AvailableComponent[]>([]);
    selectedDeductions = signal<TemplateDeduction[]>([]);
    deductionsSearchQuery = signal('');

    filteredAvailableDeductions = computed(() => {
        const selected = this.selectedDeductions().map(d => d.component_id);
        let available = this.availableDeductions().filter(c => !selected.includes(c._id));
        const q = this.deductionsSearchQuery().toLowerCase().trim();
        if (q) {
            available = available.filter(c =>
                c.component_name.toLowerCase().includes(q) ||
                c.component_code.toLowerCase().includes(q)
            );
        }
        return available;
    });

    // ─── STEP 4: CTC Preview ───
    ctcInputType = signal<'annual' | 'monthly'>('annual');
    annualCtc = signal<number>(0);
    monthlyGross = signal<number>(0);

    earningsPreview = computed(() => {
        const baseCTC = this.ctcInputType() === 'annual' ? this.annualCtc() : this.monthlyGross() * 12;
        const earnings = this.selectedEarnings();

        // Build a resolved map: component_code -> annual amount
        const resolved: Record<string, number> = { GROSS: baseCTC };
        const results: { component_name: string; component_code: string; monthly: number; annual: number; is_basic: boolean }[] = [];

        // Pass 1: resolve fixed components
        for (const e of earnings) {
            if (e.value_type === 'fixed') {
                const annual = (e.fixed_amount || 0) * 12;
                resolved[e.component_code || ''] = annual;
            }
        }

        // Pass 2: resolve formula components (e.g. BASIC = GROSS * 0.50)
        for (const e of earnings) {
            if (e.value_type === 'formula' && e.formula) {
                const annual = this.evaluateFormula(e.formula, resolved, baseCTC);
                resolved[e.component_code || ''] = annual;
            }
        }

        // Pass 3: resolve percentage-of-basic components (BASIC is now resolved)
        for (const e of earnings) {
            if (e.value_type === 'percentage') {
                const basicAnnual = resolved['BASIC'] || 0;
                const annual = basicAnnual * (e.percentage || 0) / 100;
                resolved[e.component_code || ''] = annual;
            }
        }

        // Build final results
        for (const e of earnings) {
            const annual = resolved[e.component_code || ''] || 0;
            results.push({
                component_name: e.component_name || '',
                component_code: e.component_code || '',
                monthly: Math.round(annual / 12),
                annual: Math.round(annual),
                is_basic: e.is_basic || false,
            });
        }

        return results;
    });

    deductionsPreview = computed(() => {
        const earningResolved: Record<string, number> = {};
        for (const ep of this.earningsPreview()) {
            earningResolved[ep.component_code] = ep.annual;
        }
        const baseCTC = this.ctcInputType() === 'annual' ? this.annualCtc() : this.monthlyGross() * 12;
        earningResolved['GROSS'] = baseCTC;
        const basicAnnual = earningResolved['BASIC'] || 0;

        return this.selectedDeductions().map(d => {
            // Look up the full component to get calculation_type, fixed_amount, percentage, formula
            const comp = this.availableDeductions().find(c => c._id === d.component_id);
            const calcType = comp?.calculation_type || '';
            let annual = 0;

            if (calcType === 'fixed' && comp?.fixed_amount) {
                annual = (comp.fixed_amount || 0) * 12;
            } else if ((calcType === 'percentage_of_basic' || calcType === 'percentage') && comp?.percentage) {
                annual = basicAnnual * (comp.percentage || 0) / 100;
            } else if (calcType === 'formula' && comp?.formula) {
                // Use the same formula evaluation as earnings, passing resolved earnings and baseCTC
                annual = this.evaluateFormula(comp.formula, earningResolved, baseCTC);
            }

            return {
                component_name: d.component_name || '',
                component_code: d.component_code || '',
                monthly: Math.round(annual / 12),
                annual: Math.round(annual),
            };
        });
    });

    /**
     * Evaluates a simple formula string like "GROSS * 0.50", "BASIC + 1000", "BASIC * 0.40"
     * Supports: +, -, *, / operators and references to component codes (GROSS, BASIC, HRA, etc.)
     */
    private evaluateFormula(formula: string, resolved: Record<string, number>, grossAnnual: number): number {
        try {
            // Replace known component code tokens with their resolved values
            let expression = formula.trim();

            // Sort keys by length descending so longer codes are replaced first (e.g., BASIC_DA before BASIC)
            const sortedKeys = Object.keys(resolved).sort((a, b) => b.length - a.length);
            for (const key of sortedKeys) {
                if (key) {
                    const regex = new RegExp(`\\b${key}\\b`, 'g');
                    expression = expression.replace(regex, String(resolved[key] || 0));
                }
            }

            // Convert percentage syntax: 12% → /100  (e.g. BASIC*12% → BASIC*12/100)
            expression = expression.replace(/%/g, '/100');

            // Convert MIN/MAX/ROUND to Math.min/Math.max/Math.round
            expression = expression.replace(/\bMIN\b/gi, 'Math.min');
            expression = expression.replace(/\bMAX\b/gi, 'Math.max');
            expression = expression.replace(/\bROUND\b/gi, 'Math.round');

            // Safety: allow digits, decimals, operators, spaces, parentheses, commas, Math.*
            if (!/^[\d\s+\-*/().,a-zA-Z]+$/.test(expression)) {
                return 0;
            }

            // Evaluate the arithmetic expression
            const result = Function(`"use strict"; return (${expression});`)();
            return typeof result === 'number' && isFinite(result) ? result : 0;
        } catch {
            return 0;
        }
    }

    totalMonthlyEarnings = computed(() => this.earningsPreview().reduce((s, e) => s + e.monthly, 0));
    totalAnnualEarnings = computed(() => this.earningsPreview().reduce((s, e) => s + e.annual, 0));
    totalMonthlyDeductions = computed(() => this.deductionsPreview().reduce((s, d) => s + d.monthly, 0));
    totalAnnualDeductions = computed(() => this.deductionsPreview().reduce((s, d) => s + d.annual, 0));
    netMonthlySalary = computed(() => this.totalMonthlyEarnings() - this.totalMonthlyDeductions());
    netAnnualSalary = computed(() => this.totalAnnualEarnings() - this.totalAnnualDeductions());

    totalEarningsPercentage = computed(() => {
        return this.selectedEarnings()
            .filter(e => e.value_type === 'percentage')
            .reduce((sum, e) => sum + (e.percentage || 0), 0);
    });

    // ─── STEP 5: Display & Controls ───
    displayControlsForm: FormGroup = this._fb.group({
        allow_manual_override: [true],
        lock_after_assignment: [false],
        version_control_enabled: [true],
    });

    // ─── Validation ───
    hasBasicComponent = computed(() => this.selectedEarnings().some(e => e.is_basic));

    async ngOnInit(): Promise<void> {
        this.pageTabs = await this._commonService.getTabs('PAYROLL_TEMPLATE_WIZARD');
        if (this.pageTabs.length > 0) {
            this.currentTab = this.pageTabs[0].key;
        }

        this.templateId = this._route.snapshot.paramMap.get('id')!;
        if (this.templateId) {
            this.isEditMode.set(true);
        }

        // Load components first, then template details (so formula lookup works)
        this.loadComponentsThenTemplate();
    }

    private loadComponentsThenTemplate(): void {
        const earningsPayload = { type: 'EARNINGS', status: 'ACTIVE', search: null, page: 1, limit: 200 };
        const deductionsPayload = { type: 'DEDUCTIONS', status: 'ACTIVE', search: null, page: 1, limit: 200 };

        forkJoin({
            earnings: this._httpClient.post(API_ENDPOINTS.payroll.get_components, earningsPayload),
            deductions: this._httpClient.post(API_ENDPOINTS.payroll.get_components, deductionsPayload),
        }).pipe(takeUntil(this.destroy$)).subscribe({
            next: (responses: any) => {
                const earningsComponents = responses.earnings?.data?.components || responses.earnings?.data || [];
                const deductionsComponents = responses.deductions?.data?.components || responses.deductions?.data || [];
                this.availableEarnings.set(earningsComponents);
                this.availableDeductions.set(deductionsComponents);

                // Now load template details (components are available for formula lookup)
                if (this.isEditMode()) {
                    this.loadTemplateDetails();
                }
            },
            error: (error) => console.error('Error loading components:', error)
        });
    }

    // ─── Load Components ───
    loadEarningsComponents(): void {
        const payload = {
            type: 'EARNINGS',
            status: 'ACTIVE',
            search: null,
            page: 1,
            limit: 200,
        };
        this._httpClient.post(API_ENDPOINTS.payroll.get_components, payload).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response: any) => {
                const components = response?.data?.components || response?.data || [];
                this.availableEarnings.set(components);
            },
            error: (error) => console.error('Error loading earnings components:', error)
        });
    }

    loadDeductionsComponents(): void {
        const payload = {
            type: 'DEDUCTIONS',
            status: 'ACTIVE',
            search: null,
            page: 1,
            limit: 200,
        };
        this._httpClient.post(API_ENDPOINTS.payroll.get_components, payload)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    const components = response?.data?.components || response?.data || [];
                    this.availableDeductions.set(components);
                },
                error: (error) => console.error('Error loading deduction components:', error)
            });
    }

    // ─── Load Template (Edit mode) ───
    loadTemplateDetails(): void {
        const payload = {
            id: this.templateId,
        };
        this._httpClient.post(API_ENDPOINTS.payroll.get_template_by_id, payload)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    const template = response?.data;
                    if (template) {
                        this.patchFormData(template);
                    }
                },
                error: (error) => console.error('Error loading template details:', error)
            });
    }

    patchFormData(template: any): void {
        this.basicInfoForm.patchValue({
            template_name: template.template_name,
            template_code: template.template_code,
            description: template.description,
            effective_from: template.effective_from ? new Date(template.effective_from as string) : null,
            status: template.status,
        });

        // Flatten nested component_id objects for earnings
        if (template.earnings?.length) {
            const flatEarnings: TemplateEarning[] = template.earnings.map((e: any) => {
                const comp = typeof e.component_id === 'object' ? e.component_id : null;
                const compId = comp ? comp._id : e.component_id;
                const compName = comp?.component_name || e.component_name || '';
                const compCode = comp?.component_code || e.component_code || '';
                const isBasic = comp?.is_basic ?? e.is_basic ?? false;
                const calcType = comp?.calculation_type || e.calculation_type || '';

                // Look up formula from available components (formula lives on the component, not template)
                let formula = e.formula;
                if (!formula && e.value_type === 'formula') {
                    const availComp = this.availableEarnings().find(ac => ac._id === compId);
                    formula = availComp?.formula || '';
                }

                return {
                    component_id: compId,
                    component_name: compName,
                    component_code: compCode,
                    value_type: e.value_type,
                    fixed_amount: e.fixed_amount ?? undefined,
                    percentage: e.percentage ?? undefined,
                    formula: formula ?? undefined,
                    override_allowed: e.override_allowed ?? true,
                    calculation_order: e.calculation_order ?? 0,
                    is_mandatory: e.is_mandatory ?? false,
                    is_basic: isBasic,
                    calculation_type: calcType,
                } as TemplateEarning;
            });
            this.selectedEarnings.set(flatEarnings);
        }

        // Flatten nested component_id objects for deductions
        if (template.deductions?.length) {
            const flatDeductions: TemplateDeduction[] = template.deductions.map((d: any) => {
                const comp = typeof d.component_id === 'object' ? d.component_id : null;
                const compId = comp ? comp._id : d.component_id;

                // Look up full component to get calculation_type, fixed_amount, percentage, formula
                const availComp = this.availableDeductions().find(ac => ac._id === compId);

                return {
                    component_id: compId,
                    component_name: comp?.component_name || d.component_name || '',
                    component_code: comp?.component_code || d.component_code || '',
                    deduction_nature: comp?.deduction_nature || d.deduction_nature || '',
                    calculation_type: availComp?.calculation_type || d.calculation_type || '',
                    fixed_amount: d.fixed_amount ?? availComp?.fixed_amount ?? undefined,
                    percentage: d.percentage ?? availComp?.percentage ?? undefined,
                    formula: d.formula ?? availComp?.formula ?? undefined,
                    override_allowed: d.override_allowed ?? false,
                } as TemplateDeduction;
            });
            this.selectedDeductions.set(flatDeductions);
        }

        if (template.ctc_preview) {
            if (template.ctc_preview.annual_ctc) {
                this.ctcInputType.set('annual');
                this.annualCtc.set(template.ctc_preview.annual_ctc);
                this.monthlyGross.set(Math.round(template.ctc_preview.annual_ctc / 12));
            } else if (template.ctc_preview.monthly_gross) {
                this.ctcInputType.set('monthly');
                this.monthlyGross.set(template.ctc_preview.monthly_gross);
                this.annualCtc.set(template.ctc_preview.monthly_gross * 12);
            }
        }
        this.displayControlsForm.patchValue({
            allow_manual_override: template.allow_manual_override ?? true,
            lock_after_assignment: template.lock_after_assignment ?? false,
            version_control_enabled: template.version_control_enabled ?? true,
        });
    }

    // ─── STEP 2: Earnings Methods ───
    addEarning(component: AvailableComponent): void {
        const isBasic = component.is_basic || false;
        if (isBasic && this.hasBasicComponent()) {
            this._toastr.warning('Only one BASIC component is allowed per template.', 'Warning');
            return;
        }

        const valueType = component.calculation_type === 'formula' ? 'formula'
            : (component.calculation_type === 'percentage' || component.calculation_type === 'percentage_of_basic') ? 'percentage'
                : 'fixed';

        const earning: TemplateEarning = {
            component_id: component._id,
            component_name: component.component_name,
            component_code: component.component_code,
            value_type: valueType,
            fixed_amount: valueType === 'fixed' ? (component.fixed_amount || 0) : undefined,
            percentage: valueType === 'percentage' ? (component.percentage || 0) : undefined,
            formula: valueType === 'formula' ? (component.formula || '') : undefined,
            override_allowed: true,
            calculation_order: this.selectedEarnings().length + 1,
            is_mandatory: isBasic,
            is_basic: isBasic,
            calculation_type: component.calculation_type,
        };

        this.selectedEarnings.update(earnings => [...earnings, earning]);
    }

    removeEarning(index: number): void {
        const earning = this.selectedEarnings()[index];
        if (earning.is_basic) {
            this._toastr.warning('BASIC component is mandatory and cannot be removed.', 'Warning');
            return;
        }
        this.selectedEarnings.update(earnings => earnings.filter((_, i) => i !== index));
    }

    updateEarning(index: number, field: string, value: any): void {
        this.selectedEarnings.update(earnings => {
            const updated = [...earnings];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    }

    moveEarningUp(index: number): void {
        if (index === 0) return;
        this.selectedEarnings.update(earnings => {
            const updated = [...earnings];
            [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
            return updated.map((e, i) => ({ ...e, calculation_order: i + 1 }));
        });
    }

    moveEarningDown(index: number): void {
        if (index >= this.selectedEarnings().length - 1) return;
        this.selectedEarnings.update(earnings => {
            const updated = [...earnings];
            [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
            return updated.map((e, i) => ({ ...e, calculation_order: i + 1 }));
        });
    }

    // ─── STEP 3: Deductions Methods ───
    addDeduction(component: AvailableComponent): void {
        const deduction: TemplateDeduction = {
            component_id: component._id,
            component_name: component.component_name,
            component_code: component.component_code,
            deduction_nature: component.deduction_nature,
            calculation_type: component.calculation_type,
            fixed_amount: component.fixed_amount || undefined,
            percentage: component.percentage || undefined,
            formula: component.formula || undefined,
            override_allowed: component.deduction_nature !== 'statutory',
        };
        this.selectedDeductions.update(deductions => [...deductions, deduction]);
    }

    removeDeduction(index: number): void {
        const deduction = this.selectedDeductions()[index];
        if (deduction.deduction_nature === 'statutory') {
            this._toastr.warning('Statutory deductions cannot be removed.', 'Warning');
            return;
        }
        this.selectedDeductions.update(deductions => deductions.filter((_, i) => i !== index));
    }

    updateDeduction(index: number, field: string, value: any): void {
        this.selectedDeductions.update(deductions => {
            const updated = [...deductions];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    }

    // ─── CTC Update ───
    onCtcInputChange(value: number): void {
        if (this.ctcInputType() === 'annual') {
            this.annualCtc.set(value);
            this.monthlyGross.set(Math.round(value / 12));
        } else {
            this.monthlyGross.set(value);
            this.annualCtc.set(value * 12);
        }
    }

    // ─── Navigation ───
    goToNextTab(): void {
        const currentIndex = this.pageTabs.findIndex(t => t.key === this.currentTab);
        if (currentIndex < this.pageTabs.length - 1) {
            this.currentTab = this.pageTabs[currentIndex + 1].key;
        }
    }

    goToPreviousTab(): void {
        const currentIndex = this.pageTabs.findIndex(t => t.key === this.currentTab);
        if (currentIndex > 0) {
            this.currentTab = this.pageTabs[currentIndex - 1].key;
        }
    }

    getCurrentStepIndex(): number {
        return this.pageTabs.findIndex(t => t.key === this.currentTab);
    }

    isLastStep(): boolean {
        return this.getCurrentStepIndex() === this.pageTabs.length - 1;
    }

    isFirstStep(): boolean {
        return this.getCurrentStepIndex() === 0;
    }

    // ─── Construct Payload ───
    constructTemplatePayload(): any {
        const basicInfo = this.basicInfoForm.value;
        const displayControls = this.displayControlsForm.value;

        const earnings = this.selectedEarnings().map(e => ({
            component_id: e.component_id,
            value_type: e.value_type,
            fixed_amount: e.value_type === 'fixed' ? e.fixed_amount : null,
            percentage: e.value_type === 'percentage' ? e.percentage : null,
            formula: e.value_type === 'formula' ? e.formula : null,
            override_allowed: e.override_allowed,
            calculation_order: e.calculation_order,
            is_mandatory: e.is_mandatory,
        }));

        const deductions = this.selectedDeductions().map(d => ({
            component_id: d.component_id,
            calculation_type: d.calculation_type || null,
            fixed_amount: d.calculation_type === 'fixed' ? (d.fixed_amount || null) : null,
            percentage: (d.calculation_type === 'percentage_of_basic' || d.calculation_type === 'percentage') ? (d.percentage || null) : null,
            formula: d.calculation_type === 'formula' ? (d.formula || null) : null,
            override_allowed: d.override_allowed,
        }));

        const ctcPreview: CtcPreview = {
            annual_ctc: this.annualCtc(),
            monthly_gross: this.monthlyGross(),
            total_annual_earnings: this.totalAnnualEarnings(),
            total_monthly_earnings: this.totalMonthlyEarnings(),
            total_annual_deductions: this.totalAnnualDeductions(),
            total_monthly_deductions: this.totalMonthlyDeductions(),
            net_annual_salary: this.netAnnualSalary(),
            net_monthly_salary: this.netMonthlySalary(),
        };

        const payload: any = {
            template_name: basicInfo.template_name,
            template_code: basicInfo.template_code,
            description: basicInfo.description || '',
            effective_from: basicInfo.effective_from,
            status: basicInfo.status,
            earnings,
            deductions,
            ctc_preview: ctcPreview,
            allow_manual_override: displayControls.allow_manual_override,
            lock_after_assignment: displayControls.lock_after_assignment,
            version_control_enabled: displayControls.version_control_enabled,
        };

        if (this.isEditMode() && this.templateId) {
            payload.id = this.templateId;
        }

        return payload;
    }

    // ─── Validation ───
    validateTemplate(): boolean {
        if (this.basicInfoForm.invalid) {
            this._toastr.error('Please complete Basic Information.', 'Validation Error');
            this.currentTab = this.pageTabs[0].key;
            return false;
        }
        if (!this.hasBasicComponent()) {
            this._toastr.error('Template must include a BASIC earning component.', 'Validation Error');
            this.currentTab = this.pageTabs[1].key;
            return false;
        }
        if (this.selectedEarnings().length === 0) {
            this._toastr.error('Template must have at least one earning component.', 'Validation Error');
            this.currentTab = this.pageTabs[1].key;
            return false;
        }
        const percentTotal = this.totalEarningsPercentage();
        if (percentTotal > 100) {
            this._toastr.error('Total earnings percentage cannot exceed 100%.', 'Validation Error');
            this.currentTab = this.pageTabs[1].key;
            return false;
        }
        return true;
    }

    // ─── Submit ───
    onSubmit(): void {
        if (!this.validateTemplate()) return;

        const payload = this.constructTemplatePayload();
        const endpoint = this.isEditMode() ? API_ENDPOINTS.payroll.update_template : API_ENDPOINTS.payroll.create_template;

        this._httpClient.post(endpoint, payload)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    const msg = this.isEditMode() ? 'Template updated successfully' : 'Template created successfully';
                    this._toastr.success(msg, 'Success');
                    this._router.navigate(['/home/payroll-module/templates']);
                },
                error: (error) => {
                    console.error('Error saving template:', error);
                    this._toastr.error('Failed to save template.', 'Error');
                }
            });
    }

    handleBack(): void {
        this._location.back();
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
