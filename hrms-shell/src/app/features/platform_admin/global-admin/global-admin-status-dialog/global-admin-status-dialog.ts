import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MATERIAL } from '../../../../shared/material/materials';

@Component({
  selector: 'app-global-admin-status-dialog',
  imports: [MATERIAL,CommonModule,FormsModule],
  templateUrl: './global-admin-status-dialog.html',
  styleUrl: './global-admin-status-dialog.scss',
})
export class GlobalAdminStatusDialog {
  reason = '';

  constructor(
    private dialogRef: MatDialogRef<GlobalAdminStatusDialog>,
    @Inject(MAT_DIALOG_DATA) public data: {
      status: 'activate' | 'deactivate';
      adminName: string;
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
