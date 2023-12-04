import { Routes } from '@angular/router';
import { HasRoleGuard } from '../../guards/has-role.guard';
import { UserRole } from '../../interfaces/auth.interfaces';
import { HomeComponent } from './home.component';

export const HomeRoutes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      {
        path: 'projects',
        canActivate: [HasRoleGuard],
        data: { roles: [UserRole.USER] },
        loadChildren: () =>
          import('./project-list/project-list.routes').then(
            (m) => m.ProjectListRoutes
          ),
      },
      {
        path: 'editor',
        canActivate: [HasRoleGuard],
        data: { roles: [UserRole.USER, UserRole.GUEST] },
        loadChildren: () =>
          import('./editor/editor.routes').then((m) => m.EditorRoutes),
      },
      {
        path: 'viewer',
        canActivate: [HasRoleGuard],
        data: { roles: [UserRole.USER, UserRole.GUEST] },
        loadChildren: () =>
          import('./viewer/viewer.routes').then((m) => m.ViewerRoutes),
      },
      {
        path: 'recorder',
        canActivate: [HasRoleGuard],
        data: { roles: [UserRole.USER] },
        loadChildren: () =>
          import('./recorder/recorder.routes').then((m) => m.RecorderRoutes),
      },
      {
        path: 'profile',
        canActivate: [HasRoleGuard],
        data: { roles: [UserRole.USER] },
        loadChildren: () =>
          import('./profile/profile.routes').then((m) => m.ProfileRoutes),
      },
      {
        path: 'notifications',
        canActivate: [HasRoleGuard],
        data: { roles: [UserRole.USER] },
        loadChildren: () =>
          import('./notification-list/notification-list.routes').then(
            (m) => m.NotificationListRoutes
          ),
      },
      {
        path: 'livestream',
        loadChildren: () =>
          import('./livestream/livestream.routes').then(
            (m) => m.LivestreamRoutes
          ),
      },
      {
        path: '**',
        redirectTo: 'projects',
      },
    ],
  },
];

// @NgModule({
//   imports: [RouterModule.forChild(routes)],
//   exports: [RouterModule],
// })
// export class HomeRoutingModule {}
