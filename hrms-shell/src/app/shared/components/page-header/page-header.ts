import { Component, inject, input, model, output } from '@angular/core';
import { MATERIAL } from '../../material/materials';
import { CommonModule,Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Interface for the tabs (Exported so parent components can use it)
export interface HeaderTab {
  label: string;
  id?: string | number;
  route?: string;
  subFeatureKey?: string;
  key: string;
}

@Component({
  selector: 'app-page-header',
  imports: [MATERIAL, CommonModule, FormsModule, RouterModule],
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
})
export class PageHeader {

  private _location = inject(Location);

  // 1. Title of the page (Required)
  title = input.required<string>();

  // 2. Breadcrumbs array (e.g. ['HRMS', 'Employees', 'Details'])
  breadcrumbs = input<string[]>([]);

  // 3. Optional Tabs to display at the bottom
  tabs = input<HeaderTab[]>([]);

  // 4. Two-way binding for the Active Tab
  // Parent uses: [(activeTab)]="currentTab"
  activeTab = model<string | number | null>(null);

  // 5. Back Button Click Event

  // Helper method to switch tabs
  selectTab(tab: HeaderTab) {
    const id = tab.key || tab.route || null;
    this.activeTab.set(id);
  }

  // Helper to get tab identifier
  getTabId(tab: HeaderTab): string | number {
    return tab.key || tab.route || '';
  }

  goBack() {
    this._location.back();
  }
}
