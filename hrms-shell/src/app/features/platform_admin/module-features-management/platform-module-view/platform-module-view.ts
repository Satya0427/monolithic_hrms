import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MATERIAL } from '../../../../shared/material/materials';

@Component({
  selector: 'app-platform-module-view',
  imports: [MATERIAL, FormsModule, CommonModule, RouterModule],
  templateUrl: './platform-module-view.html',
  styleUrl: './platform-module-view.scss',
})
export class PlatformModuleView {
  module = {
    name: 'Recruitment',
    code: 'RECRUITMENT',
    description: 'End-to-end recruitment and hiring management.',
    status: 'Enabled',
    createdOn: '05 Jan 2026',
    features: [
      { name: 'Job Requisition', code: 'JOB_REQUISITION', status: 'Enabled' },
      { name: 'Candidate Pipeline', code: 'CANDIDATE_PIPELINE', status: 'Enabled' },
      { name: 'Interview Scheduling', code: 'INTERVIEW_SCHEDULING', status: 'Enabled' },
      { name: 'Offer Management', code: 'OFFER_MANAGEMENT', status: 'Disabled' }
    ]
  };
}
