import { Component, Inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MATERIAL } from '../../material/materials';
import { CommonModule } from '@angular/common';

// --- CONFIGURATION INTERFACES ---
export interface DialogFieldConfig {
  key: string;           // Form Control Name (e.g., 'docNumber')
  label: string;         // Display Label (e.g., 'PAN Number')
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  options?: string[];    // For 'select' type
  required?: boolean;
  placeholder?: string;
  value?: any;           // Default Value
}

export interface FileUploadDialogData {
  title: string;           // Header Title
  accept: string;          // File types (e.g., '.jpg,.pdf')
  documentType?: any;
  fields: DialogFieldConfig[]; // List of fields to generate
}

@Component({
  selector: 'app-upload-doc-dialog',
  imports: [MATERIAL, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './upload-doc-dialog.html',
  styleUrl: './upload-doc-dialog.scss',
})
export class UploadDocDialog {
  dynamicForm: FormGroup = new FormGroup({});
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  fileError = signal<boolean>(false);
  isImage = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UploadDocDialog>,
    @Inject(MAT_DIALOG_DATA) public data: FileUploadDialogData
  ) { }

  ngOnInit() {
    // Dynamically build the form based on passed config
    const formGroup: any = {};
    this.data.fields.forEach(field => {
      const validators = field.required ? [Validators.required] : [];
      formGroup[field.key] = [field.value || '', validators];
    });
    this.dynamicForm = this.fb.group(formGroup);
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile.set(file);
      this.fileError.set(false);
      this.isImage.set(file.type.startsWith('image/'));

      const reader = new FileReader();
      reader.onload = () => this.previewUrl.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  save() {
    if (!this.selectedFile()) {
      this.fileError.set(true);
      return;
    }

    if (this.dynamicForm.valid) {
      // Return Data to Parent
      this.dialogRef.close({
        formData: this.dynamicForm.value,
        file: this.selectedFile(),
        preview: this.previewUrl()
      });
    } else {
      this.dynamicForm.markAllAsTouched();
    }
  }
}
