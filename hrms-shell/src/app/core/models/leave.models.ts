// leave.models.ts
export interface LeavePolicy {
    id?: number;
    basicInfo: {
        policyName: string;
        description: string;
        effectiveFrom: string;
        effectiveTo?: string;
        status: 'Draft' | 'Active';
    };
    applicability: {
        employeeType: 'All' | 'Permanent' | 'Contract';
        gender: 'All' | 'Male' | 'Female';
        maritalStatus: 'All' | 'Married' | 'Single';
        probation: boolean;
        noticePeriod: boolean;
    };
    leaveRules: LeaveRuleConfig[];
    sandwichRule: {
        isApplicable: boolean;
        countWeeklyOffs: boolean;
        countHolidays: boolean;
    };
}

export interface LeaveRuleConfig {
    leaveType: string; // CL, SL, EL
    credit: {
        frequency: 'Monthly' | 'Quarterly' | 'Yearly';
        amount: number;
        maxBalance: number;
    };
    restrictions: {
        maxPerMonth: number;
        minPerRequest: number;
        maxPerRequest: number;
        allowHalfDay: boolean;
        allowNegative: boolean;
    };
    approval: {
        requireApproval: boolean;
        autoApprove: boolean;
        docRequired: boolean;
        docAfterDays: number;
    };
    yearEnd: {
        allowCarryForward: boolean;
        maxCarryForward: number;
        allowEncashment: boolean;
        maxEncashment: number;
    };
}