import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-breadcrumb',
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.css',
})
export class Breadcrumb {
  //#region injections
  protected service = inject(BreadcrumbService)
  //#endregion
}
