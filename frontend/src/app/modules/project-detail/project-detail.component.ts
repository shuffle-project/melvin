import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { ProjectEntity } from 'src/app/services/api/entities/project.entity';
import { AppState } from 'src/app/store/app.state';
import * as projectsActions from '../../store/actions/projects.actions';
import * as editorSelectors from '../../store/selectors/editor.selector';
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
    MatDialogModule,
    MatTabsModule,
    ProjectGeneralComponent,
    ProjectTranscriptionComponent,
    ProjectActivityComponent,
    UploadAdditionalContentComponent,
    PushPipe,
    MatIconModule,
    MatButtonModule,
  ],
})
export class ProjectDetailComponent {
  public project$: Observable<ProjectEntity | null>;
  private tabs: ProjectDetailDialogTab[] = [
    'general',
    'transcription',
    'activity',
  ];

  public selectedTabIndex: number = 0;
  public projectId!: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: ProjectDetailDialogData,
    public dialog: MatDialog,
    private store: Store<AppState>
  ) {
    this.selectedTabIndex = this.tabs.findIndex((o) => o === data.tab) || 0;
    this.projectId = data.projectId;
    this.store.dispatch(projectsActions.findOne({ projectId: this.projectId }));
    this.project$ = this.store.select(editorSelectors.selectProject);
  }
}
