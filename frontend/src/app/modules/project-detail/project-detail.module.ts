import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { UploadFilesModule } from '../../components/upload-files/upload-files.module';
import { SharedModule } from '../shared/shared.module';
import { ProjectActivityModule } from './components/project-activity/project-activity.module';
import { ProjectGeneralModule } from './components/project-general/project-general.module';
import { ProjectTranscriptionModule } from './components/project-transcription/project-transcription.module';
import { UploadAdditionalContentComponent } from './components/upload-additional-content/upload-additional-content.component';
import { ProjectDetailComponent } from './project-detail.component';

@NgModule({
  declarations: [ProjectDetailComponent, UploadAdditionalContentComponent],
  imports: [
    CommonModule,
    SharedModule,
    ProjectActivityModule,
    ProjectGeneralModule,
    ProjectTranscriptionModule,
    UploadFilesModule,
  ],
  exports: [ProjectDetailComponent],
})
export class ProjectDetailModule {}
