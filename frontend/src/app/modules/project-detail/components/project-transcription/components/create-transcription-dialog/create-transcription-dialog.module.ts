import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatRadioModule } from '@angular/material/radio';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { CreateTranscriptionDialogComponent } from './create-transcription-dialog.component';

@NgModule({
  declarations: [CreateTranscriptionDialogComponent],
  imports: [CommonModule, MatRadioModule, SharedModule],
  exports: [CreateTranscriptionDialogComponent],
})
export class CreateTranscriptionDialogModule {}
