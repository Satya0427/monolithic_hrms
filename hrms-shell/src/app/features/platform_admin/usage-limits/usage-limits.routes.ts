import { Routes } from "@angular/router";
import { UsageLimits } from "./usage-limits";
import { UsageLimitsOverview } from "./usage-limits-overview/usage-limits-overview";
import { OrganizationUsageDetail } from "./organization-usage-detail/organization-usage-detail";

export const USATE_LIMIT_ROUTES: Routes = [
    { path: 'usage-limit-overview', component: UsageLimitsOverview },
    { path: 'usage-limit-org-details', component: OrganizationUsageDetail },
    { path: '', redirectTo: 'usage-limit-overview', pathMatch: 'full' }
]