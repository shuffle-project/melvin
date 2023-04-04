import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../../modules/shared/shared.module';
import { GuestLoginDialogComponent } from './components/guest-login/guest-login-dialog.component';
import { InviteRoutingModule } from './invite-routing.module';
import { InviteComponent } from './invite.component';

@NgModule({
  declarations: [InviteComponent, GuestLoginDialogComponent],
  imports: [CommonModule, InviteRoutingModule, SharedModule],
})
export class InviteModule {}
