import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatLegacyDialog as MatDialog, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { Store } from '@ngrx/store';
import { lastValueFrom, Subject, take, takeUntil } from 'rxjs';
import { ProjectDetailComponent } from 'src/app/modules/project-detail/project-detail.component';
import { ProjectEntity } from 'src/app/services/api/entities/project.entity';
import { TranscriptionEntity } from 'src/app/services/api/entities/transcription.entity';
import { AppState } from 'src/app/store/app.state';
import * as transcriptionsActions from '../../../../../../store/actions/transcriptions.actions';
import * as authSelectors from '../../../../../../store/selectors/auth.selector';
import * as editorSelectors from '../../../../../../store/selectors/editor.selector';
import { EditTranscriptionDialogComponent } from '../edit-transcription-dialog/edit-transcription-dialog.component';

@Component({
  selector: 'app-transcription',
  templateUrl: './transcription.component.html',
  styleUrls: ['./transcription.component.scss'],
})
export class TranscriptionComponent implements OnInit, OnDestroy {
  @Input() transcription!: TranscriptionEntity;

  public userId!: string | null;
  public project!: ProjectEntity;
  private destroy$$ = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    private dialogRefProjectDetail: MatDialogRef<ProjectDetailComponent>,
    private dialog: MatDialog
  ) {
    this.store
      .select(editorSelectors.selectProject)
      .pipe(takeUntil(this.destroy$$))
      .subscribe((project) => {
        if (project === null) {
          return;
        }
        this.project = project;
      });
  }

  async ngOnInit() {
    this.userId = await lastValueFrom(
      this.store.select(authSelectors.selectUserId).pipe(take(1))
    );
  }

  ngOnDestroy() {
    this.destroy$$.next();
  }

  onClickDeleteTranscription(transcriptId: string) {
    this.store.dispatch(
      transcriptionsActions.removeFromEditor({ transcriptionId: transcriptId })
    );
  }

  onOpenTranscription(transcriptionId: string) {
    this.store.dispatch(transcriptionsActions.select({ transcriptionId }));
    this.dialogRefProjectDetail.close();
  }

  onClickEditTranscription(transcription: TranscriptionEntity) {
    this.dialogRefProjectDetail.close();
    this.dialog.open(EditTranscriptionDialogComponent, {
      data: transcription,
      width: '100%',
      maxWidth: '700px',
      maxHeight: '80vh',
    });
  }

  async onDownloadSubtitles(format: 'srt' | 'vtt', transcriptionId: string) {
    this.store.dispatch(
      transcriptionsActions.downloadSubtitles({ transcriptionId, format })
    );
  }
}