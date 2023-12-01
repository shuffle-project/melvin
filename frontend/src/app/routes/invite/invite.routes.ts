import { Routes } from '@angular/router';
import { InviteComponent } from './invite.component';

export const InviteRoutes: Routes = [
  {
    component: InviteComponent,
    path: '',
  },
];

// @NgModule({
//   imports: [RouterModule.forChild(routes)],
//   exports: [RouterModule],
// })
// export class InviteRoutingModule {}
