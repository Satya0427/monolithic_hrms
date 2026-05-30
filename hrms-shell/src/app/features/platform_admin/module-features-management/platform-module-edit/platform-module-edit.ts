import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MATERIAL } from '../../../../shared/material/materials';

@Component({
  selector: 'app-platform-module-edit',
  imports: [MATERIAL, FormsModule, CommonModule, RouterModule],
  templateUrl: './platform-module-edit.html',
  styleUrl: './platform-module-edit.scss',
})
export class PlatformModuleEdit {
  module = {
    name: 'Recruitment',
    code: 'RECRUITMENT',
    description: 'End-to-end recruitment and hiring management.',
    enabled: true,
    features: [
      { name: 'Job Requisition', code: 'JOB_REQUISITION', enabled: true },
      { name: 'Candidate Pipeline', code: 'CANDIDATE_PIPELINE', enabled: true },
      { name: 'Interview Scheduling', code: 'INTERVIEW_SCHEDULING', enabled: true },
      { name: 'Offer Management', code: 'OFFER_MANAGEMENT', enabled: false }
    ]
  };

  addFeature() {
    this.module.features.push({
      name: '',
      code: '',
      enabled: true
    });
  }

  removeFeature(index: number) {
    this.module.features.splice(index, 1);
  }
}
