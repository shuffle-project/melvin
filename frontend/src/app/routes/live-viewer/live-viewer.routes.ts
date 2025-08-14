import { Routes } from '@angular/router';
import { LiveViewerComponent } from './live-viewer.component';

export const LiveViewerRoutes: Routes = [
  {
    path: ':token',
    component: LiveViewerComponent,
  },
];
