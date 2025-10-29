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
        title: $localize`:@@projectListPageTitle:Project List - Melvin`,
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
        path: 'recorder',
        canActivate: [HasRoleGuard],
        data: { roles: [UserRole.USER] },
        title: $localize`:@@RecorderPageTitle:Recorder - Melvin`,
        loadChildren: () =>
          import('./recorder/recorder.routes').then((m) => m.RecorderRoutes),
      },
      {
        path: 'profile',
        canActivate: [HasRoleGuard],
        data: { roles: [UserRole.USER] },
        title: $localize`:@@profilePageTitle:Profile - Melvin`,
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
