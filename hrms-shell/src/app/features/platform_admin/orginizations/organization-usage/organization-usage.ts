import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from "@angular/router";
import { MATERIAL } from '../../../../shared/material/materials';

@Component({
  selector: 'app-organization-usage',
  imports: [MATERIAL, CommonModule, RouterLink],
  templateUrl: './organization-usage.html',
  styleUrl: './organization-usage.scss',
})
export class OrganizationUsage {

}
