import { Component, Inject, OnInit } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store/app.state';
import * as projectsActions from '../../store/actions/projects.actions';

export type ProjectDetailDialogTab = 'general' | 'transcription' | 'activity';

export interface ProjectDetailDialogData {
  projectId: string;
  tab?: ProjectDetailDialogTab;
}

@Component({
  selector: 'app-project-detail',
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss'],
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
