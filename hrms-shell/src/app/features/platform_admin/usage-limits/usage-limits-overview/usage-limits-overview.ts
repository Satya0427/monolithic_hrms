import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsageAlertChip } from "../usage-alert-chip/usage-alert-chip";
import { RouterLink, RouterModule } from "@angular/router";
import { MATERIAL } from '../../../../shared/material/materials';

@Component({
  selector: 'app-usage-limits-overview',
  imports: [
    MATERIAL,
    CommonModule,
    UsageAlertChip,
    RouterModule
],
  templateUrl: './usage-limits-overview.html',
  styleUrl: './usage-limits-overview.scss',
})
export class UsageLimitsOverview {
  displayedColumns = [
    'organization',
    'plan',
    'employees',
    'storage',
    'modules',
    'status',
    'actions'
  ];

  data = [
    {
      org: 'Spryple Technologies',
      plan: 'Enterprise',
      employeesUsed: 245,
      employeesLimit: 300,
      storageUsed: 420,
      storageLimit: 500,
      moduleUsage: 92,
      status: 'Normal'
    },
    {
      org: 'Acme Corp',
      plan: 'Growth',
      employeesUsed: 58,
      employeesLimit: 60,
      storageUsed: 95,
      storageLimit: 100,
      moduleUsage: 88,
      status: 'Near Limit'
    },
    {
      org: 'Beta Systems',
      plan: 'Starter',
      employeesUsed: 52,
      employeesLimit: 50,
      storageUsed: 110,
      storageLimit: 100,
      moduleUsage: 105,
      status: 'Exceeded'
    }
  ];
}
