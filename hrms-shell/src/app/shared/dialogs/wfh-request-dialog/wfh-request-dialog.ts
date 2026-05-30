import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MATERIAL } from '../../material/materials';
import { ApiClient } from '../../../core/services/api-client.service';
import { API_ENDPOINTS } from '../../../core/config/api-endpoints';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';

export interface WfhRequestDialogData {
  requestDate?: Date;
}

@Component({
  selector: 'app-wfh-request-dialog',
  standalone: true,
  imports: [CommonModule, MATERIAL, FormsModule, ReactiveFormsModule],
  templateUrl: './wfh-request-dialog.html',
  styleUrl: './wfh-request-dialog.scss'
})
export class WfhRequestDialog {
  private dialogRef = inject(MatDialogRef<WfhRequestDialog>);
  private _httpClient = inject(ApiClient);
  private _toastr = inject(ToastrService);
  data = inject<WfhRequestDialogData>(MAT_DIALOG_DATA);
  destroy$ = new Subject<void>();
  isSubmitting = false;

  form = inject(FormBuilder).group({
    requestDate: [this.data?.requestDate ?? new Date(), Validators.required],
    requestType: ['FULL_DAY', Validators.required],
    halfDayType: ['FIRST_HALF'],
    workLocation: ['HOME', Validators.required],
    workPlan: ['', [Validators.minLength(10)]],
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

    this.isSubmitting = true;
    const formVal = this.form.value;

    const payload: any = {
      request_date: formVal.requestDate,
      request_type: formVal.requestType,
      reason: formVal.reason
    };
    if (formVal.requestType === 'HALF_DAY') {
      payload['half_day_session'] = formVal.halfDayType;
    }

    this._httpClient.post(API_ENDPOINTS.attendance.rise_wfh_request, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this._toastr.success('WFH request submitted successfully!', 'Success', { timeOut: 3000 });
        this.dialogRef.close({ submitted: true });
      },
      error: (err) => {
        this.isSubmitting = false;
        this._toastr.error(err?.error?.msg || 'Failed to submit WFH request.', 'Error', { timeOut: 4000 });
      }
    }).add(() => {
      this.isSubmitting = false;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
