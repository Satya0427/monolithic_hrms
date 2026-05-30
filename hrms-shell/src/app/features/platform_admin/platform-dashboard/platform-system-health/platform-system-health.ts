import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MATERIAL } from '../../../../shared/material/materials';

@Component({
  selector: 'app-platform-system-health',
  imports: [MATERIAL, FormsModule, CommonModule],
  templateUrl: './platform-system-health.html',
  styleUrl: './platform-system-health.scss',
})
export class PlatformSystemHealth {
  services = [
    { name: 'API Gateway', status: 'Healthy' },
    { name: 'Authentication Service', status: 'Healthy' },
    { name: 'Background Jobs', status: 'Healthy' },
    { name: 'Email Service', status: 'Degraded' },
    { name: 'Storage Service', status: 'Healthy' }
  ];
}
