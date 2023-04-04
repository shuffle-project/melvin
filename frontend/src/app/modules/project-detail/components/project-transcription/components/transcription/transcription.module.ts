import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { CreateTranscriptionDialogModule } from '../create-transcription-dialog/create-transcription-dialog.module';
import { EditTranscriptionDialogModule } from '../edit-transcription-dialog/edit-transcription-dialog.module';
import { TranscriptionComponent } from './transcription.component';

@NgModule({
  declarations: [TranscriptionComponent],
  imports: [
    CommonModule,
    SharedModule,
    CreateTranscriptionDialogModule,
    EditTranscriptionDialogModule,
  ],
  exports: [TranscriptionComponent],
})
export class TranscriptionModule {}
