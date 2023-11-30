import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LogoModule } from '../../logo/logo.module';
import { AvatarComponent } from './avatar.component';

@NgModule({
    imports: [CommonModule, LogoModule, AvatarComponent],
    exports: [AvatarComponent],
})
export class AvatarModule {}
