import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MATERIAL } from '../../material/materials';

export interface RegularizationDialogData {
  dateLabel?: string;
  shiftName?: string;
}

@Component({
  selector: 'app-regularization-dialog',
  standalone: true,
  imports: [CommonModule, MATERIAL, FormsModule, ReactiveFormsModule],
  templateUrl: './regularization-dialog.html',
  styleUrl: './regularization-dialog.scss'
})
export class RegularizationDialog {
  private dialogRef = inject(MatDialogRef<RegularizationDialog>);
  data = inject<RegularizationDialogData>(MAT_DIALOG_DATA);

  form = inject(FormBuilder).group({
    date: [this.data?.dateLabel ?? '', Validators.required],
    shift: [this.data?.shiftName ?? '', Validators.required],
    correctionType: ['Missing Punch', Validators.required],
    checkIn: ['', Validators.required],
    checkOut: ['', Validators.required],
    reason: ['', [Validators.required, Validators.minLength(10)]]
  });

  close(): void {
    this.dialogRef.close();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close({ submitted: true, data: this.form.value });
  }
}
