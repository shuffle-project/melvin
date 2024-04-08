import { Routes } from '@angular/router';
import { ViewerComponent } from './viewer.component';

export const ViewerRoutes: Routes = [
  {
    path: ':token',
    component: ViewerComponent,
  },
];

// {
//   path: 'viewer',
//   canActivate: [HasRoleGuard],
//   data: { roles: [UserRole.USER, UserRole.GUEST, UserRole.VIEWER] },
//   loadChildren: () =>
//     import('./viewer/viewer.routes').then((m) => m.ViewerRoutes),
// },

// @NgModule({
//   imports: [RouterModule.forChild(routes)],
//   exports: [RouterModule],
// })
// export class InviteRoutingModule {}
