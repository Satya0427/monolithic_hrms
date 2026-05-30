import { Component, inject, OnInit } from '@angular/core';
import { MATERIAL } from '../../../shared/material/materials';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BaseComponent } from '../../../shared/components/base-component/base-component';
import { API_ENDPOINTS } from '../../../core/config/api-endpoints';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [MATERIAL, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login extends BaseComponent implements OnInit {

  // #region Injected Services
  private _fb = inject(FormBuilder);
  // #endregion

  protected hidePassword: boolean = true;
  protected loginForm!: FormGroup;

  ngOnInit(): void {
    sessionStorage.clear();
    this.loginForm = this._fb.group({
      email: [''],
      password: [''],
      remember: [false]
    });
  }

  clickLogin() {
    if (!this.loginForm.valid) {
      window.alert('Please fill all required fields');
      return;
    }
    const payload = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
    };
    this._apiService.post(API_ENDPOINTS.auth.login, payload, { withCredentials: true }).subscribe({
      next: (_res: any) => {
        const responsedata = _res ? _res?.data?.token?.accessToken : "";
        const userDetails = _res ? _res?.data?.user_details : "";
        // const responsedata = _res ? _res?.token?.accessToken : "";
        sessionStorage.setItem('Token', JSON.stringify(responsedata));
        sessionStorage.setItem('userDetails', JSON.stringify(userDetails));
        this.navigateTo('/home');
      },
    })
  }


  navigateToRegestration() {
    try {
      this._router.navigate(['/auth/register']);
    } catch (err: any) {
      console.error('Navigation error:', err);
    }
  }

}
