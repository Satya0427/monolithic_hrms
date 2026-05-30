import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "../header/header";
import { Breadcrumb } from '../../shared/components/breadcrumb/breadcrumb';
import { SideNav } from "../side-nav/side-nav";
import { BreakpointObserver } from '@angular/cdk/layout';
import { MATERIAL } from '../../shared/material/materials';
@Component({
  selector: 'app-layout',
  imports: [Header, SideNav,MATERIAL,RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
 isSidebarCollapsed = signal(false);

  onSidebarToggle(collapsed: any) {
    this.isSidebarCollapsed.set(collapsed);
  }
}
