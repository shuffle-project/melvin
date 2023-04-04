import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../../modules/shared/shared.module';
import { UserTestControlsComponent } from './user-test-controls.component';

@NgModule({
  declarations: [UserTestControlsComponent],
  imports: [CommonModule, SharedModule],
  exports: [UserTestControlsComponent],
})
export class UserTestControlsModule {}
