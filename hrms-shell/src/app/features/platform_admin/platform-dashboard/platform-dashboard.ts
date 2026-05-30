import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { PlatformKpiCards } from "./platform-kpi-cards/platform-kpi-cards";
import { PlatformUsageOverview } from "./platform-usage-overview/platform-usage-overview";
import { PlatformRevenueSnapshot } from "./platform-revenue-snapshot/platform-revenue-snapshot";
import { PlatformSystemHealth } from "./platform-system-health/platform-system-health";

@Component({
  selector: 'app-platform-dashboard',
  imports: [
    CommonModule,
    MatCardModule,
    PlatformKpiCards,
    PlatformUsageOverview,
    PlatformRevenueSnapshot,
    PlatformSystemHealth
],
  templateUrl: './platform-dashboard.html',
  styleUrl: './platform-dashboard.scss',
})
export class PlatformDashboard {

}
