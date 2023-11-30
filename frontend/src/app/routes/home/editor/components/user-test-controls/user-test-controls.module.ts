import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../../modules/shared/shared.module';
import { UserTestControlsComponent } from './user-test-controls.component';

@NgModule({
    imports: [CommonModule, SharedModule, UserTestControlsComponent],
    exports: [UserTestControlsComponent],
})
export class UserTestControlsModule {}
