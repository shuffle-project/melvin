import { Routes } from '@angular/router';
import { ViewerComponent } from './viewer.component';

export const ViewerRoutes: Routes = [
  {
    path: ':token',
    component: ViewerComponent,
  },
];
