import { CommonModule, Location } from '@angular/common';
import { Component, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MATERIAL } from '../../../shared/material/materials';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { CommonService } from '../../../core/services/common.service';

interface LedgerItem {
  month: string;
  opening: number;
  accrued: number;
  taken: number;
  closing: number;
  remarks?: string;
  expiry?: number; // Credits expiring this month
}

@Component({
  selector: 'app-leave-simulation',
  imports: [MATERIAL, CommonModule, FormsModule, PageHeader],
  templateUrl: './leave-simulation.html',
  styleUrl: './leave-simulation.scss',
})
export class LeaveSimulation implements OnInit {
  private _commonService = inject(CommonService);
  private _location = inject(Location);

  currentTab: string | number | null = null;
  pageTabs: any[] = [];
  simulationRan = signal(false);
  displayedColumns = ['month', 'opening', 'credit', 'debit', 'expiry', 'closing'];
  dataSource = new MatTableDataSource<LedgerItem>([]);

  // Mock Data
  ledgerData = signal<LedgerItem[]>([]);
  
  // Simulation inputs
  selectedEmployee = 'emp1';
  selectedPolicy = 'pol1';
  selectedLeaveType = 'CL';

  async ngOnInit() {
    this.pageTabs = await this._commonService.getTabs('LEAVE_ADMIN');
    if (this.pageTabs.length > 0) {
      this.currentTab = this.pageTabs[4].key; // Simulation tab
    }
  }

  runSimulation() {
    this.simulationRan.set(true);
    // Generate Dummy Ledger for 12 months
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    let balance = 2.0; // Opening

    const data = months.map(m => {
      const credit = 1;
      const taken = Math.random() > 0.7 ? 1 : 0; // Randomly take leave
      const expiry = m === 'Mar' ? 0.5 : 0; // Expire in March

      const opening = balance;
      balance = opening + credit - taken - expiry;

      return {
        month: `${m} 2024`,
        opening: parseFloat(opening.toFixed(1)),
        accrued: credit,
        taken: taken,
        expiry: expiry,
        closing: parseFloat(balance.toFixed(1))
      };
    });

    this.ledgerData.set(data);
    this.dataSource.data = data;
  }

  handleBack() {
    this._location.back();
  }
}
