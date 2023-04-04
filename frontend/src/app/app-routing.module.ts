import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IsInitializedGuard } from './guards/is-initialized.guard';
import { LoggedInGuard } from './guards/logged-in.guard';
import { LoggedOutGuard } from './guards/logged-out.guard';

const routes: Routes = [
  {
    path: 'auth',
    canActivate: [LoggedOutGuard],
    loadChildren: () =>
      import('./routes/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'home',
    canActivate: [LoggedInGuard],
    loadChildren: () =>
      import('./routes/home/home.module').then((m) => m.HomeModule),
  },
  {
    path: 'invite/:inviteToken',
    canActivate: [IsInitializedGuard],
    loadChildren: () =>
      import('./routes/invite/invite.module').then((m) => m.InviteModule),
  },
  {
    path: '**',
    redirectTo: 'auth',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { enableTracing: false })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
