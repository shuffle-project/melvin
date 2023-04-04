import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LogoModule } from '../../logo/logo.module';
import { AvatarComponent } from './avatar.component';

@NgModule({
  declarations: [AvatarComponent],
  imports: [CommonModule, LogoModule],
  exports: [AvatarComponent],
})
export class AvatarModule {}
