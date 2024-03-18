import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { CaptionEntity } from '../../services/api/entities/caption.entity';
import { ProjectEntity } from '../../services/api/entities/project.entity';
import { TranscriptionEntity } from '../../services/api/entities/transcription.entity';
import * as captionsActions from '../../store/actions/captions.actions';
import * as projectsActions from '../../store/actions/projects.actions';
import * as transcriptionsActions from '../../store/actions/transcriptions.actions';
import { AppState } from '../../store/app.state';
import { DeleteConfirmationDialogComponent } from './delete-confirmation-dialog.component';

export enum DeleteConfirmLevel {
  LOW = 'low',
}
export interface DeleteConfirmData {
  level: DeleteConfirmLevel;
  subject: string;
  description?: string;
}

export interface DeleteConfirmResult {
  delete: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DeleteConfirmationService {
  constructor(private dialog: MatDialog, private store: Store<AppState>) {}

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

  deleteProject(project: ProjectEntity) {
    this.confirm(
      {
        level: DeleteConfirmLevel.LOW,
        subject: $localize`:@@deleteServiceSubjectProject:Project`,
        description: project.title,
      },
      () => {
        this.store.dispatch(
          projectsActions.remove({ removeProjectId: project.id })
        );
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
