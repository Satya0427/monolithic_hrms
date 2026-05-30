import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { MATERIAL } from '../../../../shared/material/materials';
import { API_ENDPOINTS } from '../../../../core/config/api-endpoints';
import { ApiClient } from '../../../../core/services/api-client.service';

@Component({
  selector: 'app-global-admin-create',
  imports: [MATERIAL, CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './global-admin-create.html',
  styleUrl: './global-admin-create.scss',
})
export class GlobalAdminCreate implements OnInit {
  private _fb = inject(FormBuilder);
  private _httpClient = inject(ApiClient);
  private _router = inject(Router);
  private _toastr = inject(ToastrService);
  private _route = inject(ActivatedRoute);

  private destroy$ = new Subject<void>();

  // Signals
  organizations = signal<any[]>([]);
  adminId!: string;

  // Global Admin Form
  adminForm: FormGroup = this._fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    mobile_number: ['', [Validators.required, Validators.pattern(/^[0-9\s\+\-\(\)]{10,}$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    organization_id: [null, [Validators.required]],
    send_invitation_email: [true]
  });

  ngOnInit(): void {
    this.adminId = this._route.snapshot.paramMap.get('id')!;
    this.loadOrganizations();
    if (this.adminId) {
      this.getAdminDetails();
      const passwordControl = this.adminForm.get('password');
      passwordControl?.clearValidators();   // remove required/minLength
      passwordControl?.disable();           // disable field
      passwordControl?.updateValueAndValidity();
    }
  }

  //  Load organizations for dropdown
  loadOrganizations() {
    const payload = {
      search_key: ''
    }
    this._httpClient.post(API_ENDPOINTS.lookups.orginization_dropdown, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (_res: any) => {
        if (_res?.data && Array.isArray(_res.data)) {
          const orgs = _res.data.map((org: any) => ({
            id: org.id || org.org_id,
            name: org.org_name
          }));
          this.organizations.set(orgs);
          console.log(this.organizations())
        }
      },
      error: (_err: any) => {
        console.error('Error loading organizations:', _err);
        this._toastr.error('Failed to load organizations');
      }
    });
  }

  // Get Admin Details API Call
  getAdminDetails() {
    if (!this.adminId) return;
    const payload = {
      "adminId": this.adminId
    };
    this._httpClient.post(API_ENDPOINTS.globalAdmin.get_by_id, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (_res: any) => {
        if (_res?.data) {
          this.adminForm.patchValue({
            name: _res.data.name,
            email: _res.data.email,
            mobile_number: _res.data.phone_number,
            organization_id: _res.data.organization_id,
            send_invitation_email: _res.data.send_invitation_email || true
          });
          console.log('Admin details loaded:', _res.data);
          this._toastr.success('Admin details loaded successfully');
        }
      },
      error: (_err: any) => {
        console.error('Error fetching admin details:', _err);
        this._toastr.error('Failed to load admin details');
      },
      complete: () => {
      }
    });
  }

  //  Save/Create Admin API Call
  saveAdmin() {
    if (!this.adminForm.valid) {
      this._toastr.error('Please fill all required fields correctly');
      return;
    }

    const payload: any = {
      name: this.adminForm.get('name')?.value,
      email: this.adminForm.get('email')?.value,
      phone_number: this.adminForm.get('mobile_number')?.value,
      organization_id: this.adminForm.get('organization_id')?.value,
    };
    if (this.adminId) {
      payload['adminId'] = this.adminId
    } else {
      payload['password'] = this.adminForm.get('password')?.value || ''
    }
    this._httpClient.post(API_ENDPOINTS.globalAdmin.create, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (_res: any) => {
        const message = this.adminId ? 'Admin updated successfully' : 'Admin created successfully';
        this._toastr.success(_res?.msg || message);
        setTimeout(() => {
          this._router.navigate(['/home/paltform-management/global-admin/global-admin-list']);
        }, 300);
      },
      error: (_err: any) => {
        console.error('Error saving admin:', _err);
        this._toastr.error(_err?.message || 'Failed to save admin');
      }
    });
  }

  // Cancel and go back
  cancel() {
    this._router.navigate(['/home/paltform-management/global-admin/global-admin-list']);
  }

  //  Reset form
  resetForm() {
    this.adminForm.reset({
      send_invitation_email: true
    });
  }
}
