import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";
import { MATERIAL } from '../../../../shared/material/materials';

@Component({
  selector: 'app-organization-usage-detail',
  imports: [
    MATERIAL,
    RouterLink
],
  templateUrl: './organization-usage-detail.html',
  styleUrl: './organization-usage-detail.scss',
})
export class OrganizationUsageDetail {
  organization = {
    name: 'Spryple Technologies',
    plan: 'Enterprise',
    status: 'Active',
    createdOn: '12 Jan 2026'
  };

  limits = {
    employees: { used: 245, limit: 300 },
    storage: { used: 420, limit: 500 }
  };

  modules = [
    { name: 'Recruitment', usage: 92 },
    { name: 'Onboarding', usage: 76 },
    { name: 'Payroll', usage: 58 },
    { name: 'Performance', usage: 41 },
    { name: 'Learning', usage: 22 }
  ];
}
