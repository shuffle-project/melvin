import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ActivityModule } from '../activity/activity.module';
import { NotificationComponent } from './notification.component';

@NgModule({
  declarations: [NotificationComponent],
  imports: [CommonModule, ActivityModule],
  exports: [NotificationComponent],
})
export class NotificationModule {}
