import { Routes } from "@angular/router";
import { PlatformModuleList } from "./platform-module-list/platform-module-list";
import { PlatformModuleView } from "./platform-module-view/platform-module-view";
import { PlatformModuleEdit } from "./platform-module-edit/platform-module-edit";
import { PlatformModuleCreate } from "./platform-module-create/platform-module-create";

export const MODULE_FEATURES_MANAGEMENT_ROUTES: Routes = [
    { path: 'platform-module-list', component: PlatformModuleList },
    { path: 'platform-module-create', component: PlatformModuleCreate },
    { path: 'platform-module-edit', component: PlatformModuleEdit },
    { path: 'platform-module-view', component: PlatformModuleView },
    { path: '', redirectTo: 'platform-module-list', pathMatch: 'full' },
]