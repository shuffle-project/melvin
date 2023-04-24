import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { MatStepperModule } from '@angular/material/stepper';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { AlertModule } from 'src/app/components/alert/alert.module';
import { UploadFilesModule } from 'src/app/components/upload-files/upload-files.module';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { CreateProjectService } from 'src/app/services/create-project/create-project.service';
import { ProjectASRFormComponent } from './components/project-asr-form/project-asr-form.component';
import { ProjectLiveFormComponent } from './components/project-live-form/project-live-form.component';
import { ProjectMetadataFormComponent } from './components/project-metadata-form/project-metadata-form.component';
import { ProjectOverviewFormComponent } from './components/project-overview-form/project-overview-form.component';
import { ProjectSourceFormComponent } from './components/project-source-form/project-source-form.component';
import { ProjectVideoFormComponent } from './components/project-video-form/project-video-form.component';
import { DialogCreateProjectComponent } from './dialog-create-project.component';

@NgModule({
  declarations: [
    DialogCreateProjectComponent,
    ProjectMetadataFormComponent,
    ProjectLiveFormComponent,
    ProjectVideoFormComponent,
    ProjectSourceFormComponent,
    ProjectASRFormComponent,
    ProjectOverviewFormComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    MatTabsModule,
    MatAutocompleteModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatStepperModule,
    MatRadioModule,
    UploadFilesModule,
    MatSlideToggleModule,
    AlertModule,
  ],
  providers: [CreateProjectService],
})
export class DialogCreateProjectModule {}
