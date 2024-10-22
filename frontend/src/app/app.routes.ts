import { Routes } from '@angular/router';
import { IsConfigLoadedGuard } from './guards/is-config-loaded.guard';
import { IsInitializedGuard } from './guards/is-initialized.guard';
import { LoggedInGuard } from './guards/logged-in.guard';

export const AppRoutes: Routes = [
  {
    path: '',
    canActivate: [],
    loadChildren: () =>
      import('./routes/landing/landing.routes').then((m) => m.LandingRoutes),
  },
  {
    path: 'home',
    canActivate: [LoggedInGuard, IsConfigLoadedGuard],
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
    path: 'view',
    canActivate: [IsConfigLoadedGuard],
    loadChildren: () =>
      import('./routes/viewer/viewer.routes').then((m) => m.ViewerRoutes),
  },
  {
    path: '**',
    redirectTo: '',
  },
];

// @NgModule({
//   imports: [RouterModule.forRoot(routes, { enableTracing: false })], // tracing is only debugging
//   exports: [RouterModule],
// })
// export class AppRoutingModule {}
