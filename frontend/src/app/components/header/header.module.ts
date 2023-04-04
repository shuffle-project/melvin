import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { TimeDifferencePipeModule } from 'src/app/pipes/time-difference-pipe/time-difference-pipe.module';
import { LogoModule } from '../logo/logo.module';
import { NotificationModule } from '../notification/notification.module';
import { HeaderComponent } from './header.component';
@NgModule({
  declarations: [HeaderComponent],
  imports: [
    CommonModule,
    SharedModule,
    LogoModule,
    RouterModule,
    MatBadgeModule,
    TimeDifferencePipeModule,
    NotificationModule,
  ],
  exports: [HeaderComponent],
})
export class HeaderModule {}
