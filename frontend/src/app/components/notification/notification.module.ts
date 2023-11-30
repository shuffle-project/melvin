import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ActivityModule } from '../activity/activity.module';
import { NotificationComponent } from './notification.component';

@NgModule({
    imports: [CommonModule, ActivityModule, NotificationComponent],
    exports: [NotificationComponent],
})
export class NotificationModule {}
