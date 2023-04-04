import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { TranscriptionModule } from './components/transcription/transcription.module';
import { ProjectTranscriptionComponent } from './project-transcription.component';

@NgModule({
  declarations: [ProjectTranscriptionComponent],
  imports: [CommonModule, SharedModule, TranscriptionModule],
  exports: [ProjectTranscriptionComponent],
})
export class ProjectTranscriptionModule {}
