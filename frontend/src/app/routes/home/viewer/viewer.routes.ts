import { Routes } from '@angular/router';
import { ViewerComponent } from './viewer.component';

export const ViewerRoutes: Routes = [
  {
    path: ':id',
    component: ViewerComponent,
  },
];

// @NgModule({
//   imports: [RouterModule.forChild(ViewerRoutes)],
//   exports: [RouterModule],
// })
// export class ViewerRoutingModule {}
