import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MATERIAL } from '../../material/materials';
import { CommonModule } from '@angular/common';
import { ApiClient } from '../../../core/services/api-client.service';
import { ToastrService } from 'ngx-toastr';
import { API_ENDPOINTS } from '../../../core/config/api-endpoints';
import { takeUntil, Subject } from 'rxjs';

export interface ILeaveBalance {
    leave_type_id: string;
    leave_type_name: string;
    leave_type_code: string;
    total_credited: number;
    total_debited: number;
    available_balance: number;
    pending_requests: number;
    color?: string;
}

export interface LeaveRequest {
    employee_id: string;
    leave_type_id: string;
    from_date: Date;
    to_date: Date;
    is_half_day: boolean;
    half_day_type?: 'FIRST_HALF' | 'SECOND_HALF';
    reason: string;
    total_days: number;
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
}

export interface ApplyLeaveDialogData {
    employee_id: string;
    leaveBalances: ILeaveBalance[];
}

@Component({
    selector: 'app-apply-leave-dialog',
    imports: [MATERIAL, FormsModule, ReactiveFormsModule, CommonModule],
    templateUrl: './apply-leave-dialog.html',
    styleUrl: './apply-leave-dialog.scss',
})
export class ApplyLeaveDialog implements OnInit {
    private fb = inject(FormBuilder);
    private _httpClient = inject(ApiClient);
    private _toastr = inject(ToastrService);
    private destroy$ = new Subject<void>();

    dialogRef = inject(MatDialogRef<ApplyLeaveDialog>);
    data = inject<ApplyLeaveDialogData>(MAT_DIALOG_DATA);

    submittingLeave = signal<boolean>(false);
    validatingRequest = signal<boolean>(false);

    applyLeaveForm: FormGroup = this.fb.group({
        leave_type_id: ['', Validators.required],
        from_date: ['', Validators.required],
        to_date: ['', Validators.required],
        is_half_day: [false],
        half_day_type: ['FIRST_HALF'],
        reason: ['', [Validators.required, Validators.minLength(10)]],
    });

    ngOnInit() {
        this.applyLeaveForm.get('is_half_day')?.valueChanges.subscribe(isHalfDay => {
            const halfDayTypeControl = this.applyLeaveForm.get('half_day_type');
            if (isHalfDay) {
                halfDayTypeControl?.setValidators(Validators.required);
            } else {
                halfDayTypeControl?.clearValidators();
            }
            halfDayTypeControl?.updateValueAndValidity();
        });
    }

    get leaveBalances(): ILeaveBalance[] {
        return this.data?.leaveBalances || [];
    }

    calculateLeaveDays(): number {
        const fromDate = this.applyLeaveForm.get('from_date')?.value;
        const toDate = this.applyLeaveForm.get('to_date')?.value;
        const isHalfDay = this.applyLeaveForm.get('is_half_day')?.value;

        if (!fromDate || !toDate) return 0;

        if (isHalfDay) return 0.5;

        const from = new Date(fromDate);
        const to = new Date(toDate);
        const diffTime = Math.abs(to.getTime() - from.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    }

    async validateLeaveRequest(): Promise<boolean> {
        this.validatingRequest.set(true);
        const formValue = this.applyLeaveForm.value;
        const fromDate = new Date(formValue.from_date);
        const toDate = new Date(formValue.to_date);

        if (!formValue.leave_type_id) {
            this._toastr.error('Please select a leave type');
            this.validatingRequest.set(false);
            return false;
        }

        if (fromDate > toDate) {
            this._toastr.error('From date cannot be after To date');
            this.validatingRequest.set(false);
            return false;
        }

        const selectedLeave = this.leaveBalances.find(b => b.leave_type_id === formValue.leave_type_id);
        const requestedDays = this.calculateLeaveDays();

        if (!selectedLeave) {
            this._toastr.error('Invalid leave type selected');
            this.validatingRequest.set(false);
            return false;
        }

        if (requestedDays > selectedLeave.available_balance) {
            this._toastr.error(`Insufficient balance. Available: ${selectedLeave.available_balance}, Requested: ${requestedDays}`);
            this.validatingRequest.set(false);
            return false;
        }

        try {
            const payload = {
                employee_id: this.data.employee_id,
                leave_type_id: formValue.leave_type_id,
                from_date: this.formatDate(fromDate),
                to_date: this.formatDate(toDate)
            };
            const res: any = await this._httpClient.post(API_ENDPOINTS.leave.check_leave_overlap, payload).pipe(takeUntil(this.destroy$)).toPromise();
            if (res?.data?.has_overlap) {
                this._toastr.error('Leave dates overlap with existing leave request');
                this.validatingRequest.set(false);
                return false;
            }
        } catch (err) {
            console.error('Error checking overlap:', err);
        }

        this.validatingRequest.set(false);
        return true;
    }

    async submitLeaveRequest() {
        if (!this.applyLeaveForm.valid) {
            this.applyLeaveForm.markAllAsTouched();
            this._toastr.warning('Please fill all required fields');
            return;
        }

        // const isValid = await this.validateLeaveRequest();
        // if (!isValid) return;

        this.submittingLeave.set(true);
        const formValue = this.applyLeaveForm.value;
        const totalDays = this.calculateLeaveDays();

        const payload: LeaveRequest = {
            employee_id: this.data.employee_id,
            leave_type_id: formValue.leave_type_id,
            from_date: new Date(formValue.from_date),
            to_date: new Date(formValue.to_date),
            is_half_day: formValue.is_half_day,
            half_day_type: formValue.is_half_day ? formValue.half_day_type : undefined,
            reason: formValue.reason,
            total_days: totalDays,
            status: 'SUBMITTED'
        };

        this._httpClient.post(API_ENDPOINTS.leave.apply_leave, payload).pipe(takeUntil(this.destroy$)).subscribe({
            next: (res: any) => {
                this.submittingLeave.set(false);
                this._toastr.success('Leave request submitted successfully');
                this.dialogRef.close({ success: true, data: res });
            },
            error: (err: any) => {
                this.submittingLeave.set(false);
                console.error('Error submitting leave request:', err);
            }
        });
    }

    formatDate(date: Date): string {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    close() {
        this.dialogRef.close();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
