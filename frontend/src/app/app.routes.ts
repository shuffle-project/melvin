import { Routes } from '@angular/router';
import { IsInitializedGuard } from './guards/is-initialized.guard';
import { LoggedInGuard } from './guards/logged-in.guard';
import { LoggedOutGuard } from './guards/logged-out.guard';

export const AppRoutes: Routes = [
  {
    path: 'auth',
    canActivate: [LoggedOutGuard],
    loadChildren: () =>
      import('./routes/auth/auth.routes').then((m) => m.AuthRoutes),
  },
  {
    path: 'home',
    canActivate: [LoggedInGuard],
    loadChildren: () =>
      import('./routes/home/home.routes').then((m) => m.HomeRoutes),
  },
  {
    path: 'invite/:inviteToken',
    canActivate: [IsInitializedGuard],
    loadChildren: () =>
      import('./routes/invite/invite.routes').then((m) => m.InviteRoutes),
  },
  {
    path: '**',
    redirectTo: 'auth',
  },
];

// @NgModule({
//   imports: [RouterModule.forRoot(routes, { enableTracing: false })], // tracing is only debugging
//   exports: [RouterModule],
// })
// export class AppRoutingModule {}
