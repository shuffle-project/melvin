import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { AvatarGroupComponent } from './avatar-group.component';


@NgModule({
    imports: [CommonModule, SharedModule, AvatarGroupComponent],
    exports: [AvatarGroupComponent],
})
export class AvatarGroupModule {}
