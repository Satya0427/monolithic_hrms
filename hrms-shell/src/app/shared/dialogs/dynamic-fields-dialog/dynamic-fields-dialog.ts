import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { MATERIAL } from '../../material/materials';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export type FieldType = 'text' | 'number' | 'email' | 'password' | 'date' | 'select' | 'textarea' | 'file' | 'heading';

export interface FieldConfig {
  controlName: string;         // Form Control Name
  label: string;        // Display Label
  type: FieldType;      // Input Type
  value?: any;          // Initial Value
  options?: any[];         // For Select Dropdowns (string[] or {key: string, value: string}[])
  icon?: string;        // Material Icon Name (suffix)
  width?: 'half' | 'full'; // Grid layout control
  validators?: ValidatorFn[]; // Angular Validators
  disabled?: boolean;   // Disabled state
}

import { Observable } from 'rxjs';

export interface DialogData {
  title: string;
  fields: FieldConfig[];
  onSave?: (data: any) => Observable<any>;
}
@Component({
  selector: 'app-dynamic-fields-dialog',
  imports: [CommonModule, ReactiveFormsModule, MATERIAL],
  templateUrl: './dynamic-fields-dialog.html',
  styleUrl: './dynamic-fields-dialog.scss',
})
export class DynamicFieldsDialog {
  private fb = inject(FormBuilder);
  public dialogRef = inject(MatDialogRef<DynamicFieldsDialog>);
  public data = inject<DialogData>(MAT_DIALOG_DATA);
  loading = signal(false);

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.createForm();
  }

  createForm(): FormGroup {
    const group: any = {};
    this.data.fields.forEach((field) => {
      if (field.type === 'heading') return;
      // Add control with initial value, validators, and disabled state
      group[field.controlName] = [
        { value: field.value || '', disabled: !!field.disabled },
        field.validators || []
      ];
    });
    return this.fb.group(group);
  }

  // Handle File Input Changes
  onFileChange(event: any, fieldName: string) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.form.patchValue({ [fieldName]: file });
    }
  }

  onSubmit() {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    const formData = this.form.getRawValue();

    if (this.data.onSave) {
      this.loading.set(true);
      this.data.onSave(formData).subscribe({
        next: (res) => {
          this.loading.set(false);
          this.dialogRef.close(res);
        },
        error: (err) => {
          this.loading.set(false);
          // Error handling is usually done in the service/parent, 
          // but we keep dialog open here as requested.
        }
      });
    } else {
      this.dialogRef.close(formData);
    }
  }

  close() {
    this.dialogRef.close();
  }
}
