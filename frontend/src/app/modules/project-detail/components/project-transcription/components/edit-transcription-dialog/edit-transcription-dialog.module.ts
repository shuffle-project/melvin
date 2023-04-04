import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { EditTranscriptionDialogComponent } from './edit-transcription-dialog.component';

@NgModule({
  declarations: [EditTranscriptionDialogComponent],
  imports: [CommonModule, SharedModule],
  exports: [EditTranscriptionDialogComponent],
})
export class EditTranscriptionDialogModule {}
