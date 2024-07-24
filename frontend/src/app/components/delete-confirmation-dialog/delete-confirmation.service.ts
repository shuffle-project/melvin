import { Injectable, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Subject, take, takeUntil } from 'rxjs';
import { CaptionEntity } from 'src/app/services/api/entities/caption.entity';
import { TranscriptionEntity } from 'src/app/services/api/entities/transcription.entity';
import { ProjectEntity } from '../../services/api/entities/project.entity';
import * as captionsActions from '../../store/actions/captions.actions';
import * as projectsActions from '../../store/actions/projects.actions';
import * as transcriptionsActions from '../../store/actions/transcriptions.actions';
import { AppState } from '../../store/app.state';
import * as authSelectors from '../../store/selectors/auth.selector';
import { DeleteConfirmationDialogComponent } from './delete-confirmation-dialog.component';

export enum DeleteConfirmLevel {
  LOW = 'low',
}
export interface DeleteConfirmData {
  level: DeleteConfirmLevel;
  subject: string;
  description?: string;
  type?: 'delete' | 'leave';
}

export interface DeleteConfirmResult {
  delete: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DeleteConfirmationService implements OnDestroy {
  userId!: string | null;
  private destroy$$ = new Subject<void>();

  constructor(private dialog: MatDialog, private store: Store<AppState>) {
    this.store
      .select(authSelectors.selectUserId)
      .pipe(takeUntil(this.destroy$$))
      .subscribe((userId) => {
        this.userId = userId;
      });
  }

  confirm(data: DeleteConfirmData, callOnConfirm: () => any) {
    this.dialog
      .open<
        DeleteConfirmationDialogComponent,
        DeleteConfirmData,
        DeleteConfirmResult
      >(DeleteConfirmationDialogComponent, {
        data,
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((result) => {
        if (result?.delete) {
          callOnConfirm();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$$.next();
  }

  deleteProject(project: ProjectEntity) {
    this.confirm(
      {
        level: DeleteConfirmLevel.LOW,
        subject: $localize`:@@deleteServiceSubjectProject:Project`,
        description: project.title,
        type: 'delete',
      },
      () => {
        this.store.dispatch(
          projectsActions.remove({ removeProjectId: project.id })
        );
      }
    );
  }

  leaveProject(project: ProjectEntity) {
    this.confirm(
      {
        level: DeleteConfirmLevel.LOW,
        subject: $localize`:@@deleteServiceSubjectProject:Project`,
        description: project.title,
        type: 'leave',
      },
      () => {
        if (this.userId !== null) {
          this.store.dispatch(
            projectsActions.removeUserFromProject({
              projectId: project.id,
              userId: this.userId,
            })
          );
        }
      }
    );
  }

  deleteTranscription(transcription: TranscriptionEntity) {
    this.confirm(
      {
        level: DeleteConfirmLevel.LOW,
        subject: $localize`:@@deleteServiceSubjectTranscription:Transcription`,
        description: transcription.title,
      },
      () => {
        this.store.dispatch(
          transcriptionsActions.removeFromEditor({
            transcriptionId: transcription.id,
          })
        );
      }
    );
  }

  deleteCaption(caption: CaptionEntity) {
    this.confirm(
      {
        level: DeleteConfirmLevel.LOW,
        subject: $localize`:@@deleteServiceSubjectCaption:Caption`,
        description: caption.text,
      },
      () => {
        this.store.dispatch(
          captionsActions.remove({ removeCaptionId: caption.id })
        );
      }
    );
  }
}
