import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MATERIAL } from '../../material/materials';
import { LeaveType } from '../../../features/leave-management/leave-type-config/leave-type-config';

@Component({
  selector: 'app-leave-type-dialog',
  imports: [MATERIAL, FormsModule, ReactiveFormsModule],
  templateUrl: './leave-type-dialog.html',
  styleUrl: './leave-type-dialog.scss',
})
export class LeaveTypeDialog {
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<LeaveTypeDialog>);
  data = inject<LeaveType>(MAT_DIALOG_DATA);

  leaveForm: FormGroup = this.fb.group({
    id: [null],
    name: ['', Validators.required],
    code: ['', [Validators.required, Validators.maxLength(5)]],
    category: ['Paid', Validators.required],
    colorCode: ['#3f51b5'],
    description: [''],
    isActive: [true],
    isSystem: [false]
  });

  constructor() {
    if (this.data) {
      this.leaveForm.patchValue(this.data);
    }
  }

  save() {
    if (this.leaveForm.valid) {
      this.dialogRef.close(this.leaveForm.value);
    }
  }
}
