import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../../modules/shared/shared.module';
import { LiveControlsComponent } from './live-controls.component';

@NgModule({
  declarations: [LiveControlsComponent],
  imports: [CommonModule, SharedModule],
  exports: [LiveControlsComponent],
})
export class LiveControlsModule {}
