import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { ApiClient } from '../../../../core/services/api-client.service';
import { MATERIAL } from '../../../../shared/material/materials';
import { API_ENDPOINTS } from '../../../../core/config/api-endpoints';

@Component({
  selector: 'app-platform-module-create',
  imports: [MATERIAL, ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './platform-module-create.html',
  styleUrl: './platform-module-create.scss',
})
export class PlatformModuleCreate {
  private _fb = inject(FormBuilder);
  private _http = inject(ApiClient);
  private _toastr = inject(ToastrService);
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private destroy$ = new Subject<void>();

  moduleForm: FormGroup;
  moduleId = '';

  constructor() {
    this.moduleForm = this._fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      description: [''],
      enabled: [true],
      features: this._fb.array([])
    });
    // initialize with one feature
    this.addFeature();
  }

  ngOnInit(): void {
    this._route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.moduleId = id;
        this.loadModule(id);
      }
    });
  }

  get features(): FormArray {
    return this.moduleForm.get('features') as FormArray;
  }

  addFeature(feature?: any) {
    this.features.push(this._fb.group({
      name: [feature?.name || '', Validators.required],
      code: [feature?.code || '', Validators.required],
      route: [feature?.route || ''],
      enabled: [feature?.enabled ?? true]
    }));
  }

  removeFeature(index: number) {
    this.features.removeAt(index);
  }

  loadModule(id: string) {
    const payload = { moduleId: id };
    this._http.post(API_ENDPOINTS.platformModules.get_by_id.replace(':id', id), payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const data = res?.data || res;
        if (data) {
          this.moduleForm.patchValue({
            name: data.module_name || data.name || data.label || '',
            code: data.module_code || data.code || '',
            description: data.description || '',
            enabled: data.active ?? data.enabled ?? true
          });
          // clear features and set (map backend keys to form keys)
          while (this.features.length) this.features.removeAt(0);
          (data.features || []).forEach((f: any) => this.addFeature({
            name: f.name || '',
            code: f.code || '',
            route: f.route_path || f.route || '',
            enabled: f.active ?? f.enabled ?? true
          }));
        }
      },
      error: (err: any) => {
        console.error('Failed to load module', err);
        this._toastr.error('Failed to load module details');
      }
    });
  }

  saveModule() {
    if (this.moduleForm.invalid) {
      this._toastr.error('Please fill required fields');
      return;
    }
    const formValue = this.moduleForm.value;
    const payload: any = {
      module_name: formValue.name,
      module_code: formValue.code,
      description: formValue.description,
      active: !!formValue.enabled,
      features: (formValue.features || []).map((f: any) => ({
        name: f.name,
        code: f.code,
        route_path: f.route || '',
        active: !!f.enabled
      }))
    };
    this._http.post(API_ENDPOINTS.platformModules.create, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this._toastr.success('Module updated successfully');
        this._router.navigate(['../platform-module-list'], { relativeTo: this._route });
      },
      error: (err: any) => {
        console.error('Update failed', err);
        this._toastr.error('Failed to update module');
      }
    });
  }
}
