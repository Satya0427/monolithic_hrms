import { Component } from '@angular/core';
import { MATERIAL } from '../../../../shared/material/materials';

@Component({
  selector: 'app-platform-kpi-cards',
  imports: [MATERIAL],
  templateUrl: './platform-kpi-cards.html',
  styleUrl: './platform-kpi-cards.scss',
})
export class PlatformKpiCards {
  kpis = [
    {
      label: 'Total Organizations',
      value: 124,
      hint: '+8 this month',
      icon: 'business'
    },
    {
      label: 'Active Subscriptions',
      value: 97,
      hint: '78% conversion',
      icon: 'verified'
    },
    {
      label: 'Monthly Revenue',
      value: '₹4.8L',
      hint: '↑ 12% MoM',
      icon: 'currency_rupee'
    },
    {
      label: 'System Health',
      value: 'Healthy',
      hint: 'All services operational',
      icon: 'monitor_heart',
      status: 'healthy'
    }
  ];
}
