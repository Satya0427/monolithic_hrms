import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MATERIAL } from '../../material/materials';
import { CommonModule } from '@angular/common';

export interface Holiday {
  id?: number;
  name: string;
  date: Date;
  day?: string;
  year?: number;
  description?: string;
  type: 'National' | 'Festival' | 'Company';
  isOptional: boolean;
  isPaid: boolean;
  colorCode?: string;
  applicableTo: 'All' | 'Specific';
  locations: string[];
  departments?: string[];
  employeeTypes?: string[];
  gender?: string[];
  // Optional Holiday Rules
  maxOptionalLeaves?: number;
  requiresApproval?: boolean;
  autoCreditLeave?: boolean;
  allowCarryForward?: boolean;
  status: 'Active' | 'Inactive';
}

export interface HolidayDialogData {
  holiday?: Holiday;
  onSave?: (formData: any) => void;
}

@Component({
  selector: 'app-holiday-dialog',
  imports: [MATERIAL, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './holiday-dialog.html',
  styleUrl: './holiday-dialog.scss',
})
export class HolidayDialog implements OnInit {
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<HolidayDialog>);
  data = inject<HolidayDialogData>(MAT_DIALOG_DATA);
  
  isSaving = false;

  showAdvanced = false;

  holidayForm: FormGroup = this.fb.group({
    id: [null],
    // Basic Information
    name: ['', Validators.required],
    date: [new Date(), Validators.required],
    day: [{ value: '', disabled: true }],
    year: [{ value: new Date().getFullYear(), disabled: true }],
    description: [''],
    
    // Holiday Type & Category
    type: ['National', Validators.required],
    isOptional: [false],
    isPaid: [true, Validators.required],
    colorCode: ['#3f51b5'],
    
    // Applicability
    applicableTo: ['All', Validators.required],
    locations: [[]],
    departments: [[]],
    employeeTypes: [[]],
    gender: [[]],
    
    // Optional Holiday Rules
    maxOptionalLeaves: [0],
    requiresApproval: [false],
    autoCreditLeave: [false],
    allowCarryForward: [false],
    
    status: ['Active']
  });

  // Mock data for dropdowns
  availableLocations = [
    'Hyderabad',
    'Bangalore',
    'Mumbai',
    'Delhi',
    'Pune',
    'Chennai'
  ];

  availableDepartments = [
    'Engineering',
    'HR',
    'Finance',
    'Sales',
    'Marketing'
  ];

  availableEmployeeTypes = [
    'Permanent',
    'Contract',
    'Intern',
    'Consultant'
  ];

  availableGenders = [
    'Male',
    'Female',
    'Other'
  ];

  holidayTypes = ['National', 'Festival', 'Company'];

  ngOnInit() {
    // Patch existing data if editing
    if (this.data?.holiday) {
      this.holidayForm.patchValue(this.data.holiday);
    }

    // Auto-update day and year when date changes
    this.holidayForm.get('date')?.valueChanges.subscribe(date => {
      if (date) {
        const dateObj = new Date(date);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        this.holidayForm.patchValue({
          day: days[dateObj.getDay()],
          year: dateObj.getFullYear()
        }, { emitEvent: false });
      }
    });

    // Handle applicableTo changes
    this.holidayForm.get('applicableTo')?.valueChanges.subscribe(value => {
      const locationsControl = this.holidayForm.get('locations');
      if (value === 'Specific') {
        locationsControl?.setValidators(Validators.required);
      } else {
        locationsControl?.clearValidators();
        locationsControl?.setValue([]);
      }
      locationsControl?.updateValueAndValidity();
    });

    // Trigger initial day/year update
    const initialDate = this.holidayForm.get('date')?.value;
    if (initialDate) {
      const dateObj = new Date(initialDate);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      this.holidayForm.patchValue({
        day: days[dateObj.getDay()],
        year: dateObj.getFullYear()
      }, { emitEvent: false });
    }
  }

  get isOptionalHoliday(): boolean {
    return this.holidayForm.get('isOptional')?.value || false;
  }

  get showLocationSelect(): boolean {
    return this.holidayForm.get('applicableTo')?.value === 'Specific';
  }

  save() {
    if (this.holidayForm.invalid) {
      Object.keys(this.holidayForm.controls).forEach(key => {
        this.holidayForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formValue = this.holidayForm.getRawValue();
    
    // Validation: Check for past date (configurable)
    const selectedDate = new Date(formValue.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today && !this.data?.holiday) {
      alert('Cannot create holiday for past dates');
      return;
    }

    // If onSave callback provided, use it (keeps dialog open until success)
    if (this.data?.onSave) {
      this.isSaving = true;
      this.data.onSave(formValue);
    } else {
      // Fallback: close dialog immediately
      this.dialogRef.close(formValue);
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
