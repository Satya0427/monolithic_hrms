import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MATERIAL } from '../../../../shared/material/materials';

@Component({
  selector: 'app-platform-usage-overview',
  imports: [
    CommonModule,
    MATERIAL
  ],
  templateUrl: './platform-usage-overview.html',
  styleUrl: './platform-usage-overview.scss',
})
export class PlatformUsageOverview {

  stats = {
    totalOrgs: 124,
    activeOrgs: 97
  };

  modules = [
    { name: 'Recruitment', usage: 82 },
    { name: 'Onboarding', usage: 64 },
    { name: 'Payroll', usage: 38 },
    { name: 'Performance', usage: 29 },
    { name: 'Learning', usage: 18 }
  ];
}
