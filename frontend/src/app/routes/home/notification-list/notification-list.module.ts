import { NgModule } from '@angular/core';

import { NotificationListRoutingModule } from './notification-list-routing.module';
import { NotificationListComponent } from './notification-list.component';

@NgModule({
  imports: [NotificationListRoutingModule, NotificationListComponent],
})
export class NotificationListModule {}
