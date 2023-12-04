import { Routes } from '@angular/router';
import { NotificationListComponent } from './notification-list.component';

export const NotificationListRoutes: Routes = [
  { path: '', component: NotificationListComponent },
];

// @NgModule({
//   imports: [RouterModule.forChild(routes)],
//   exports: [RouterModule],
// })
// export class NotificationListRoutingModule {}
