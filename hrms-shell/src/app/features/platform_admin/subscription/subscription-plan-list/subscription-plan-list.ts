import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubscriptionPlanStatusDialog } from '../subscription-plan-status-dialog/subscription-plan-status-dialog';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { MATERIAL } from '../../../../shared/material/materials';
import { ApiClient } from '../../../../core/services/api-client.service';
import { API_ENDPOINTS } from '../../../../core/config/api-endpoints';

@Component({
  selector: 'app-subscription-plan-list',
  imports: [MATERIAL, CommonModule, RouterModule],
  templateUrl: './subscription-plan-list.html',
  styleUrl: './subscription-plan-list.scss',
})
export class SubscriptionPlanList implements OnInit {
  private _dialog = inject(MatDialog);
  private _apiClient = inject(ApiClient);
  displayedColumns = [
    'plan_name',
    'yearly_price',
    'employee_size',
    'status',
    'created_on',
    'actions'
  ];

  plans_data = new MatTableDataSource([])
  destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.get_plans_data();
  }

  //Get api call for  Plans data
  get_plans_data() {
    const payload = {
      "page": "1",
      "limit": "10",
      "search_key": ""
    }
    this._apiClient.post(API_ENDPOINTS.subscription.get_all_plans, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (_res: any) => {
        const data = _res.data.plan_data;

        const tableData = data.map((e: any) => ({
          id: e._id,
          plan_name: e?.plan_name || '',
          plan_code: e?.plan_code || '',
          yearly_price: e?.pricing?.yearly_price || '',
          monthly_price: e?.pricing?.monthly_price || '',
          employee_size: e?.limits?.employee_limit || '',
          status: e?.is_active || false,          // ✅ FIXED
          created_on: e?.createdAt || ''       // ✅ FIXED
        }));

        this.plans_data.data = tableData;
        console.log('Plans Data ', this.plans_data.data)
      }, error: (_err: any) => {

      }, complete: () => {

      }
    })
  }

  openStatusDialog(plan: any) {
    const dialogRef = this._dialog.open(SubscriptionPlanStatusDialog, {
      width: '420px',
      data: {
        status: plan.status === 'Active' ? 'deactivate' : 'activate',
        planName: plan.name
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        plan.status =
          plan.status === 'Active' ? 'Inactive' : 'Active';

        // Later: backend API call
      }
    });
  }

}
