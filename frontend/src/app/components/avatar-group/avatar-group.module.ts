import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { AvatarGroupComponent } from './avatar-group.component';
import { AvatarModule } from './avatar/avatar.module';

@NgModule({
  declarations: [AvatarGroupComponent],
  imports: [CommonModule, AvatarModule, SharedModule],
  exports: [AvatarGroupComponent],
})
export class AvatarGroupModule {}
