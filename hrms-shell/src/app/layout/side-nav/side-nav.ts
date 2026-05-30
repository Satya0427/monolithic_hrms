import { Component, computed, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { MATERIAL } from '../../shared/material/materials';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiClient } from '../../core/services/api-client.service';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { Subject, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { CommonService } from '../../core/services/common.service';
import { MODULE_FEATURES } from './menus';
import { environment } from '../../../environments/environement';
@Component({
  selector: 'app-side-nav',
  imports: [
    MATERIAL,
    CommonModule,
    RouterModule,
  ],
  templateUrl: './side-nav.html',
  styleUrl: './side-nav.css',
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0',
        opacity: 0,
        overflow: 'hidden'
      })),
      state('expanded', style({
        height: '*',
        opacity: 1
      })),
      transition('expanded <=> collapsed', [
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ])
    ])
  ]
})
export class SideNav implements OnInit {
  private _httpClient = inject(ApiClient);
  private _toastr = inject(ToastrService);
  private _commonService = inject(CommonService)
  isCollapsed = signal<boolean>(false);
  destroy$ = new Subject<void>()

  menuItems = signal<any[]>(MODULE_FEATURES);
  userDetails = signal<any>(null);
  async ngOnInit(): Promise<void> {
    // this.getModuleList()
    const userDetails = await this._commonService.getUserDetails();
    if(userDetails) {
      this.userDetails.set(userDetails);
      this.userDetails.update(details => ({ ...details,profile_url: `${environment.baseApiUrl}/common/get_image/${userDetails?.profile_image}` }));
      console.log('User Details in SideNav:', this.userDetails());
    }

  }

  async getModuleList() {
    const userDetails = await this._commonService.getUserDetails();
    // const payload = {
    //   role_code: userDetails,
    //   scope: userDetails,
    //   organization_id: 
    // }
    this._httpClient.get(API_ENDPOINTS.sideNav.get_menus).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const data = res?.data || res;
        if (Array.isArray(data)) {
          this.menuItems.set(this.mapModulesToSidebar(data));
        }
      },
      error: (err: any) => {
        console.error('Failed to fetch modules', err);
        this._toastr.error('Failed to load platform modules');
      }
    });
  }

  mapModulesToSidebar(modules: any[]) {
    return modules.map(module => ({
      label: module.module_name,
      icon: module.icon || 'folder',
      active: false,
      expanded: false,
      id: module._id,
      subItems: (module.features || []).map((feature: any) => ({
        label: feature.feature_name,
        route: feature.route_path,
        icon: 'chevron_right',
        active: false,
        expanded: false,
        subFeatures: (feature.sub_features || []).map((subFeature: any) => ({
          label: subFeature.sub_feature_name,
          route: subFeature.route_path,
          active: false
        }))
      }))
    }));
  }

  toggleSidebar() {
    this.isCollapsed.update(v => !v);

    // When collapsing sidebar, collapse all submenus
    if (this.isCollapsed()) {
      this.menuItems.update(items =>
        items.map(item => ({
          ...item,
          expanded: false
        }))
      );
    }
  }

  toggleSubMenu(clickedItem: any) {
    if (this.isCollapsed()) return;

    this.menuItems.update(items =>
      items.map(item => {
        if (item.key === clickedItem.key) {
          // Toggle expanded state for clicked item
          const newExpanded = !item.expanded;
          return {
            ...item,
            expanded: newExpanded,
            active: newExpanded // Set active when expanded
          };
        } else {
          // Collapse all other items and remove their active state
          return {
            ...item,
            expanded: false,
            active: false
          };
        }
      })
    );
  }

  toggleSubFeature(parent: any, subItem: any) {
    if (this.isCollapsed()) return;

    this.menuItems.update(items =>
      items.map(item => {
        if (item.key === parent.key) {
          return {
            ...item,
            expanded: true,
            active: true,
            subItems: item.subItems?.map((sub: any) => {
              if (sub.key === subItem.key) {
                return {
                  ...sub,
                  expanded: !sub.expanded
                };
              }
              return {
                ...sub,
                expanded: false
              };
            })
          };
        }
        return item;
      })
    );
  }

  activateSubItem(parent: any, sub: any) {
    this.menuItems.update(items =>
      items.map(item => {
        if (item.key === parent.key) {
          return {
            ...item,
            expanded: true, // Keep parent expanded when subitem is clicked
            active: true,
            subItems: item.subItems?.map((s: any) => ({
              ...s,
              active: s.key === sub.key,
              expanded: s.key === sub.key ? s.expanded : false
            }))
          };
        } else {
          return {
            ...item,
            expanded: false,
            active: false,
            subItems: item.subItems?.map((s: any) => ({
              ...s,
              active: false,
              expanded: false
            }))
          };
        }
      })
    );
  }

  activateSubFeature(parent: any, subItem: any, subFeature: any) {
    this.menuItems.update(items =>
      items.map(item => {
        if (item.key === parent.key) {
          return {
            ...item,
            expanded: true,
            active: true,
            subItems: item.subItems?.map((sub: any) => {
              if (sub.key === subItem.key) {
                return {
                  ...sub,
                  expanded: true,
                  active: true,
                  subFeatures: sub.subFeatures?.map((sf: any) => ({
                    ...sf,
                    active: sf.key === subFeature.key
                  }))
                };
              }
              return {
                ...sub,
                active: false,
                expanded: false,
                subFeatures: sub.subFeatures?.map((sf: any) => ({
                  ...sf,
                  active: false
                }))
              };
            })
          };
        }
        return {
          ...item,
          expanded: false,
          active: false,
          subItems: item.subItems?.map((sub: any) => ({
            ...sub,
            active: false,
            expanded: false,
            subFeatures: sub.subFeatures?.map((sf: any) => ({
              ...sf,
              active: false
            }))
          }))
        };
      })
    );
  }

  // Helper method to handle menu item click for collapsed state
  onMenuItemClick(item: any, event?: MouseEvent) {
    if (this.isCollapsed()) {
      // In collapsed state, don't toggle submenu - let mat-menu handle it
      return;
    }

    if (item.subItems?.length) {
      this.toggleSubMenu(item);
    } else {
      // Handle click for menu items without submenus
      this.menuItems.update(items =>
        items.map(i => ({
          ...i,
          active: i.key === item.key,
          expanded: false
        }))
      );
    }
  }
}
