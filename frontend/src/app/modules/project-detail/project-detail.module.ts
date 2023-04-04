import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { ProjectActivityModule } from './components/project-activity/project-activity.module';
import { ProjectGeneralModule } from './components/project-general/project-general.module';
import { ProjectTranscriptionModule } from './components/project-transcription/project-transcription.module';
import { ProjectDetailComponent } from './project-detail.component';

@NgModule({
  declarations: [ProjectDetailComponent],
  imports: [
    CommonModule,
    SharedModule,
    ProjectActivityModule,
    ProjectGeneralModule,
    ProjectTranscriptionModule,
  ],
  exports: [ProjectDetailComponent],
})
export class ProjectDetailModule {}
