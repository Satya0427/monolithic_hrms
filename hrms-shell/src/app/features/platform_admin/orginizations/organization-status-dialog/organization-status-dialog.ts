import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MATERIAL } from '../../../../shared/material/materials';

@Component({
  selector: 'app-organization-status-dialog',
  imports: [MATERIAL,CommonModule,RouterModule,FormsModule],
  templateUrl: './organization-status-dialog.html',
  styleUrl: './organization-status-dialog.scss',
})
export class OrganizationStatusDialog {
  reason = '';

  constructor(
    private dialogRef: MatDialogRef<OrganizationStatusDialog>,
    @Inject(MAT_DIALOG_DATA) public data: {
      status: 'suspend' | 'activate';
      orgName: string;
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
