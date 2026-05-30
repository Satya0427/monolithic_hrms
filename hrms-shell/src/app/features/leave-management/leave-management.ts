import { Component, inject, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from "@angular/router";
import { PageHeader } from "../../shared/components/page-header/page-header";
import { CommonService } from '../../core/services/common.service';

@Component({
  selector: 'app-leave-management',
  imports: [RouterModule, RouterOutlet],
  templateUrl: './leave-management.html',
  styleUrl: './leave-management.scss',
})
export class LeaveManagement {
}
