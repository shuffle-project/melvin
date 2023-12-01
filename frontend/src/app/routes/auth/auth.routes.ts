import { Routes } from '@angular/router';
import { AuthComponent } from './auth.component';

export const AuthRoutes: Routes = [
  {
    path: '',
    component: AuthComponent,
  },
];

// @NgModule({
//   imports: [RouterModule.forChild(routes)],
//   exports: [RouterModule],
// })
// export class AuthRoutingModule {}
