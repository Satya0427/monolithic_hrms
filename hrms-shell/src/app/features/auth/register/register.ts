import { Component, inject, OnInit } from '@angular/core';
import { MATERIAL } from '../../../shared/material/materials';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BaseComponent } from '../../../shared/components/base-component/base-component';
import { takeUntil } from 'rxjs';
import { API_ENDPOINTS } from '../../../core/config/api-endpoints';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  imports: [MATERIAL, FormsModule, ReactiveFormsModule,CommonModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register extends BaseComponent implements OnInit {
  // #region Injected Services
  private _fb = inject(FormBuilder);
  // #endregion


  signupForm!: FormGroup;
  hidePassword = true;


  ngOnInit(): void {
    this.signupForm = this._fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(128),
          Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
        ],
      ],
    });
  }

  get name() { return this.signupForm.get('name'); }
  get email() { return this.signupForm.get('email'); }
  get password() { return this.signupForm.get('password'); }

  submitRegistration() {
    if (this.signupForm.invalid) {
      window.alert('Please fill all required fields correctly.');
      return;
    }
    const formData = this.signupForm.value;
    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
    };

    this._apiService.post(API_ENDPOINTS.auth.register, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (_res: any) => {
        this._toastr.success('Registration successful! Please log in.', 'Success');
        this.navigateTo('/auth/login');
      },
      error: (error) => {
        this.handleError(error?.msg);
      },
    })
  }


}
