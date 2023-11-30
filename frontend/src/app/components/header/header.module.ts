import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/modules/shared/shared.module';


import { NotificationModule } from '../notification/notification.module';
import { HeaderComponent } from './header.component';
@NgModule({
    imports: [
    CommonModule,
    SharedModule,
    RouterModule,
    MatBadgeModule,
    NotificationModule,
    HeaderComponent,
],
    exports: [HeaderComponent],
})
export class HeaderModule {}
