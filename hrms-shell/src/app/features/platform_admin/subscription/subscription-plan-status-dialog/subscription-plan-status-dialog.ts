import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MATERIAL } from '../../../../shared/material/materials';

@Component({
  selector: 'app-subscription-plan-status-dialog',
  imports: [MATERIAL, CommonModule, FormsModule],
  templateUrl: './subscription-plan-status-dialog.html',
  styleUrl: './subscription-plan-status-dialog.scss',
})
export class SubscriptionPlanStatusDialog {
  reason = '';

  constructor(
    private dialogRef: MatDialogRef<SubscriptionPlanStatusDialog>,
    @Inject(MAT_DIALOG_DATA) public data: {
      status: 'activate' | 'deactivate';
      planName: string;
    }
  ) { }

  confirm() {
    this.dialogRef.close({
      confirmed: true,
      reason: this.reason
    });
  }

  cancel() {
    this.dialogRef.close({ confirmed: false });
  }
}
