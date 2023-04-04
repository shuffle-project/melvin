import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../../modules/shared/shared.module';
import { EditorSettingsComponent } from './editor-settings.component';

@NgModule({
  declarations: [EditorSettingsComponent],
  imports: [CommonModule, SharedModule],
  exports: [EditorSettingsComponent],
})
export class EditorSettingsModule {}
