import { Routes } from '@angular/router';
import { ViewerWrapperComponent } from './viewer-wrapper.component';

export const ViewerRoutes: Routes = [
  {
    path: ':token',
    component: ViewerWrapperComponent,
  },
];

// @NgModule({
//   imports: [RouterModule.forChild(routes)],
//   exports: [RouterModule],
// })
// export class InviteRoutingModule {}
