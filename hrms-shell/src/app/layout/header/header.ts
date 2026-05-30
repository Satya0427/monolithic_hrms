import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, input, model, output, Output, signal, TemplateRef, ViewChild } from '@angular/core';
import { MATERIAL } from '../../shared/material/materials';
import { Theme, ThemeService } from '../../core/services/theme.service';
import { BaseComponent } from '../../shared/components/base-component/base-component';
import { takeUntil } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { DialogService } from '../../core/services/dialog-service';

export interface HeaderTab {
  label: string;
  id: string | number;
}

@Component({
  selector: 'app-header',
  imports: [CommonModule, MATERIAL],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header extends BaseComponent {

  // Inputs
  title = signal<string>('New Employee Onboarding');
  breadcrumbs = signal<string[]>(['HRMS', 'Employees', 'Add New']);
  tabs = signal<HeaderTab[]>([
    { id: 'details', label: 'Employee Details' },
    { id: 'docs', label: 'Bank & Documents' },
    { id: 'comp', label: 'Compensation' }
  ]);

  // Model allows two-way binding [(activeTab)]="currentTab"
  activeTab = model<string | number | null>("details");

  // Outputs
  onBack = output<void>();

  selectTab(id: string | number) {
    this.activeTab.set(id);
  }


  public themeService = inject(ThemeService);
  private dialog = inject(DialogService);
  @Output() menuToggle = new EventEmitter<void>();

  @ViewChild('logoutTemplate', { static: true }) logoutTemplate!: TemplateRef<any>;
  reason = '';

  public themes = [
    { value: 'rose-red-theme' as Theme, label: 'Rose & Red' },
    { value: 'azure-blue-theme' as Theme, label: 'Azure & Blue' },
    { value: 'magenta-violet-theme' as Theme, label: 'Magenta & Violet' },
    { value: 'cyan-orange-theme' as Theme, label: 'Cyan & Orange' },
  ];
  isDarkTheme = () => this.themeService.currentTheme$() === 'cyan-orange-theme';

  selectTheme(theme: any): void {
    this.themeService.setTheme(theme);
  }

  // LOGOUT METHOD
  logout() {
    try {
      this._apiService.get(API_ENDPOINTS.auth.logout).pipe(takeUntil(this.destroy$)).subscribe({
        next: (_res: any) => {
          this._toastr.success('Logout success');
          sessionStorage.clear();
          this.navigateTo(['/auth/login'])
        }
      })
    } catch (error: any) {
      console.log('Catch block error in logout()', error.msg)
    }
  }


  //POPUP HANDLING
  openTemplate() {
    this.dialog.open({
      title: 'Logout',
      width: '500px',
      height: '300px',
      contentTemplate: this.logoutTemplate,
      data: { message: 'Are you sure you want to log out?' },
      actions: [
        { label: 'Cancel', value: false },
        { label: 'Ok', value: true }
      ]
    }).subscribe(result => {
      if (result) return this.callmultiplemethods();
    });
  }

  callmultiplemethods() {
    this.logout();
    this.logout();
    this.logout();
    this.logout()
  }
}
