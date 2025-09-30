import { Routes } from '@angular/router';
import { IsConfigLoadedGuard } from './guards/is-config-loaded.guard';
import { IsInitializedGuard } from './guards/is-initialized.guard';
import { LoggedInGuard } from './guards/logged-in.guard';
import { ResetPasswordComponent } from './routes/reset-password/reset-password.component';
import { VerifyEmailComponent } from './routes/verify-email/verify-email.component';

export const AppRoutes: Routes = [
  {
    path: '',
    canActivate: [],
    loadChildren: () =>
      import('./routes/landing/landing.routes').then((m) => m.LandingRoutes),
  },
  {
    path: 'admin',
    canActivate: [],
    loadChildren: () =>
      import('./routes/admin/admin.routes').then((m) => m.AdminRoutes),
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
    path: 'verify-email',
    component: VerifyEmailComponent,
    title: $localize`:@@verifyEmailPageTitle:Verify Email - Melvin`,
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    title: $localize`:@@resetPasswordPageTitle:Reset Password - Melvin`,
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
