// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Payroll Components Master — Models & Interfaces
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── Enums ────────────────────────────────────────────────────
export type ComponentType = 'EARNINGS' | 'DEDUCTIONS' | 'REIMBURSEMENTS' | 'VARIABLE_PAY';
export type ComponentCategory = 'fixed' | 'variable';
export type CalculationType = 'fixed' | 'percentage_of_basic' | 'formula';
export type DeductionNature = 'statutory' | 'non_statutory';
export type PayFrequency = 'monthly' | 'quarterly' | 'yearly';
export type ComponentStatus = 'ACTIVE' | 'INACTIVE';

// ─── Base Component (shared across all tabs) ──────────────────
export interface SalaryComponentBase {
  _id?: string;
  component_name: string;
  component_code: string;
  component_type: ComponentType;
  component_category: ComponentCategory;
  calculation_type: CalculationType;
  fixed_amount?: number;
  percentage?: number;
  formula?: string;
  taxable: boolean;
  pf_applicable: boolean;
  esi_applicable: boolean;
  professional_tax_applicable: boolean;
  show_in_payslip: boolean;
  pro_rated: boolean;
  include_in_ctc: boolean;
  effective_from: string | Date;
  status: ComponentStatus;
  description?: string;
  created_at?: string;
  updated_at?: string;
  usage_count?: number;
  linked_templates?: number;
}

// ─── Earning Component ────────────────────────────────────────
export interface EarningComponent extends SalaryComponentBase {
  component_type: 'EARNINGS';
  is_basic?: boolean;
}

// ─── Deduction Component ──────────────────────────────────────
export interface DeductionComponent extends SalaryComponentBase {
  component_type: 'DEDUCTIONS';
  deduction_nature: DeductionNature;
  employer_contribution: boolean;
  employee_contribution: boolean;
  max_cap?: number;
}

// ─── Reimbursement Component ──────────────────────────────────
export interface ReimbursementComponent extends SalaryComponentBase {
  component_type: 'REIMBURSEMENTS';
  claim_based: boolean;
  attachment_required: boolean;
  approval_required: boolean;
  max_limit_per_month?: number;
}

// ─── Variable Pay Component ───────────────────────────────────
export interface VariablePayComponent extends SalaryComponentBase {
  component_type: 'VARIABLE_PAY';
  pay_frequency: PayFrequency;
  linked_to_kpi: boolean;
  auto_calculate: boolean;
  manual_override: boolean;
}

// ─── Union Type ───────────────────────────────────────────────
export type SalaryComponent = EarningComponent | DeductionComponent | ReimbursementComponent | VariablePayComponent;

// ─── Tab Config ───────────────────────────────────────────────
export interface PayrollComponentTab {
  key: ComponentType;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const PAYROLL_TABS: PayrollComponentTab[] = [
  { key: 'EARNINGS', label: 'Earnings', icon: 'trending_up', color: '#16a34a', description: 'Fixed or recurring payments paid to employees monthly' },
  { key: 'DEDUCTIONS', label: 'Deductions', icon: 'trending_down', color: '#dc2626', description: 'Amounts deducted from salary' },
  { key: 'REIMBURSEMENTS', label: 'Reimbursements', icon: 'receipt_long', color: '#2563eb', description: 'Expense reimbursements paid outside regular earnings' },
  { key: 'VARIABLE_PAY', label: 'Variable Pay', icon: 'stars', color: '#9333ea', description: 'Performance or incentive based payments' },
];

// ─── Stats Card ───────────────────────────────────────────────
export interface StatCard {
  label: string;
  value: number;
  icon: string;
  color: string;
  bgColor: string;
}

// ─── Table Column Config ──────────────────────────────────────
export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'badge' | 'boolean' | 'date' | 'currency' | 'percentage' | 'chip';
  width?: string;
}
