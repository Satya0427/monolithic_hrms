import { Component } from '@angular/core';
import { MATERIAL } from '../../../../shared/material/materials';

@Component({
  selector: 'app-platform-revenue-snapshot',
  imports: [
    MATERIAL
  ],
  templateUrl: './platform-revenue-snapshot.html',
  styleUrl: './platform-revenue-snapshot.scss',
})
export class PlatformRevenueSnapshot {

  revenue = {
    mrr: '₹4.8L',
    arr: '₹57.6L',
    growth: '+12%'
  };

  plans = [
    { name: 'Starter', count: 42 },
    { name: 'Growth', count: 38 },
    { name: 'Enterprise', count: 17 }
  ];
}
