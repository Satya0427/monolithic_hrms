import { Routes } from "@angular/router";
import { GlobalAdminList } from "./global-admin-list/global-admin-list";
import { GlobalAdminCreate } from "./global-admin-create/global-admin-create";
import { GlobalAdminView } from "./global-admin-view/global-admin-view";

export const GLOBAL_ADMIN_ROUTES: Routes = [
    { path: 'global-admin-list', component: GlobalAdminList },
    { path: 'global-admin-create', component: GlobalAdminCreate },
    { path: 'global-admin-edit/:id', component: GlobalAdminCreate },
    { path: 'global-admin-view/:id', component: GlobalAdminView },
    { path: '', redirectTo: 'global-admin-list', pathMatch: 'full' },
]