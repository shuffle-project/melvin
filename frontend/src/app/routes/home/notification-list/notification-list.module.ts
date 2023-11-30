import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HeaderModule } from 'src/app/components/header/header.module';
import { SharedModule } from 'src/app/modules/shared/shared.module';

import { NotificationModule } from '../../../components/notification/notification.module';
import { NotificationListRoutingModule } from './notification-list-routing.module';
import { NotificationListComponent } from './notification-list.component';

@NgModule({
    imports: [
    CommonModule,
    SharedModule,
    HeaderModule,
    NotificationListRoutingModule,
    MatCheckboxModule,
    NotificationModule,
    NotificationListComponent,
],
})
export class NotificationListModule {}
