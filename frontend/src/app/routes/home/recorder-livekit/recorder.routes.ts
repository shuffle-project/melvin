import { Routes } from '@angular/router';
import { RecorderComponent } from './recorder.component';

export const RecorderRoutes: Routes = [
  {
    path: ':id',
    component: RecorderComponent,
  },
];
