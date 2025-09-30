import { Routes } from '@angular/router';
import { AdminComponent } from './admin.component';

export const AdminRoutes: Routes = [
  {
    path: '',
    component: AdminComponent,
    title: $localize`:@@adminPageTitle:Administration - Melvin`,
  },
];
