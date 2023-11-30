import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store/app.state';
import * as projectsActions from '../../store/actions/projects.actions';
import { ProjectActivityComponent } from './components/project-activity/project-activity.component';
import { ProjectGeneralComponent } from './components/project-general/project-general.component';
import { ProjectTranscriptionComponent } from './components/project-transcription/project-transcription.component';
import { UploadAdditionalContentComponent } from './components/upload-additional-content/upload-additional-content.component';

export type ProjectDetailDialogTab = 'general' | 'transcription' | 'activity';

export interface ProjectDetailDialogData {
  projectId: string;
  tab?: ProjectDetailDialogTab;
}

@Component({
  selector: 'app-project-detail',
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss'],
  standalone: true,
  imports: [
    MatTabsModule,
    ProjectGeneralComponent,
    ProjectTranscriptionComponent,
    ProjectActivityComponent,
    UploadAdditionalContentComponent,
  ],
})
export class ProjectDetailComponent implements OnInit {
  private tabs: ProjectDetailDialogTab[] = [
    'general',
    'transcription',
    'activity',
  ];

  public selectedTabIndex: number = 0;
  public projectId!: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: ProjectDetailDialogData,
    private store: Store<AppState>
  ) {
    this.selectedTabIndex = this.tabs.findIndex((o) => o === data.tab) || 0;
    this.projectId = data.projectId;
  }

  ngOnInit(): void {
    this.store.dispatch(projectsActions.findOne({ projectId: this.projectId }));
  }
}
