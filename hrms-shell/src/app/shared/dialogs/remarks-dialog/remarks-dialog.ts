import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MATERIAL } from '../../material/materials';

export interface RemarksDialogData {
  action: 'APPROVED' | 'REJECTED';
  title?: string;
}

@Component({
  selector: 'app-remarks-dialog',
  standalone: true,
  imports: [CommonModule, MATERIAL, FormsModule],
  templateUrl: './remarks-dialog.html',
  styleUrl: './remarks-dialog.scss'
})
export class RemarksDialog {
  private dialogRef = inject(MatDialogRef<RemarksDialog>);
  data = inject<RemarksDialogData>(MAT_DIALOG_DATA);

  remarks = '';
  submitted = false;

  close(): void {
    this.dialogRef.close();
  }

  submit(): void {
    this.submitted = true;

    if (this.data.action === 'REJECTED' && !this.remarks.trim()) {
      return;
    }

    this.dialogRef.close({
      confirmed: true,
      remarks: this.remarks.trim()
    });
  }
}
