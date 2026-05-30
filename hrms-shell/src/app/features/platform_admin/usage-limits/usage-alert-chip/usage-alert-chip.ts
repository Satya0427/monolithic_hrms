import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MATERIAL } from '../../../../shared/material/materials';

@Component({
  selector: 'app-usage-alert-chip',
  imports: [MATERIAL,FormsModule,CommonModule],
  templateUrl: './usage-alert-chip.html',
  styleUrl: './usage-alert-chip.scss',
})
export class UsageAlertChip {
  @Input() status: 'Normal' | 'Near Limit' | 'Exceeded' = 'Normal';

  get statusClass(): string {
    return this.status.toLowerCase().replace(' ', '-');
  }
}
