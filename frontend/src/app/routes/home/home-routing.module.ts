import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HasRoleGuard } from '../../guards/has-role.guard';
import { UserRole } from '../../interfaces/auth.interfaces';
import { HomeComponent } from './home.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      {
        path: 'projects',
        canActivate: [HasRoleGuard],
        data: { roles: [UserRole.USER, UserRole.GUEST] },
        loadChildren: () =>
          import('./project-list/project-list.module').then(
            (m) => m.ProjectListModule
          ),
      },
      {
        path: 'editor',
        canActivate: [HasRoleGuard],
        data: { roles: [UserRole.USER, UserRole.GUEST] },
        loadChildren: () =>
          import('./editor/editor.module').then((m) => m.EditorModule),
      },
      {
        path: 'profile',
        canActivate: [HasRoleGuard],
        data: { roles: [UserRole.USER] },
        loadChildren: () =>
          import('./profile/profile.module').then((m) => m.ProfileModule),
      },
      {
        path: 'notifications',
        canActivate: [HasRoleGuard],
        data: { roles: [UserRole.USER] },
        loadChildren: () =>
          import('./notification-list/notification-list.module').then(
            (m) => m.NotificationListModule
          ),
      },
      {
        path: 'livestream',
        loadChildren: () =>
          import('./livestream/livestream.module').then(
            (m) => m.LivestreamModule
          ),
      },
      {
        path: '**',
        redirectTo: 'projects',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomeRoutingModule {}
