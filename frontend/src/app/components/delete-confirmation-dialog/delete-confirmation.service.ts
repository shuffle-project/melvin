import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { lastValueFrom, map, Subject, takeUntil } from 'rxjs';
import { WrittenOutLanguagePipe } from 'src/app/pipes/written-out-language-pipe/written-out-language.pipe';
import { ApiService } from 'src/app/services/api/api.service';
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
  HIGH_PASSWORD = 'high-password',
}
export interface DeleteConfirmData {
  level: DeleteConfirmLevel;
  subject: string;
  description?: string;
  type?: 'delete' | 'leave' | 'deleteTranscription' | 'deleteAccount';
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

  constructor(
    private dialog: MatDialog,
    private store: Store<AppState>,
    private apiService: ApiService,
    private writtenOutLanguagePipe: WrittenOutLanguagePipe
  ) {
    this.store
      .select(authSelectors.selectUserId)
      .pipe(takeUntil(this.destroy$$))
      .subscribe((userId) => {
        this.userId = userId;
      });
  }

  ngOnDestroy() {
    this.destroy$$.next();
  }

  async confirm(data: DeleteConfirmData): Promise<boolean> {
    const dialogRef = this.dialog.open<
      DeleteConfirmationDialogComponent,
      DeleteConfirmData,
      DeleteConfirmResult
    >(DeleteConfirmationDialogComponent, {
      data,
    });

    return lastValueFrom(
      dialogRef.afterClosed().pipe(map((result) => result?.delete ?? false))
    );
  }

  async deleteTranscription(
    transcription: TranscriptionEntity
  ): Promise<boolean> {
    const isConfirmed = await this.confirm({
      level: DeleteConfirmLevel.LOW,
      subject: $localize`:@@deleteServiceSubjectTranscription:transcription`,
      type: 'deleteTranscription',
      description: this.writtenOutLanguagePipe.transform(
        transcription.language,
        transcription.title
      ),
    });

    if (isConfirmed) {
      this.store.dispatch(
        transcriptionsActions.removeFromEditor({
          transcriptionId: transcription.id,
        })
      );
    }

    return isConfirmed;
  }

  async deleteSpeaker(speakerName: string): Promise<boolean> {
    const isConfirmed = await this.confirm({
      level: DeleteConfirmLevel.LOW,
      subject: $localize`:@@deleteServiceSubjectSpeaker:Speaker`,
      description: $localize`:@@deleteServiceDescriptionSpeaker:The speaker „${speakerName}“ is used in several cases. The corresponding texts will not be affected if you delete it.`,
      type: 'delete',
    });

    return isConfirmed;
  }

  async deleteProject(project: ProjectEntity): Promise<boolean> {
    const isConfirmed = await this.confirm({
      level: DeleteConfirmLevel.LOW,
      subject: $localize`:@@deleteServiceSubjectProject:project`,
      description: project.title,
      type: 'delete',
    });

    if (isConfirmed) {
      this.store.dispatch(
        projectsActions.remove({ removeProjectId: project.id })
      );
    }

    return isConfirmed;
  }

  async leaveProject(project: ProjectEntity): Promise<boolean> {
    const isConfirmed = await this.confirm({
      level: DeleteConfirmLevel.LOW,
      subject: $localize`:@@deleteServiceSubjectProject:project`,
      description: project.title,
      type: 'leave',
    });

    if (isConfirmed && this.userId !== null) {
      try {
        await lastValueFrom(
          this.apiService.removeUserFromProject(project.id, this.userId)
        );
      } catch (err: unknown) {
        // TODO handle error
        const error = (err as HttpErrorResponse).message;
        console.log(error);
      }
    }

    return isConfirmed;
  }

  async deleteCaption(caption: CaptionEntity): Promise<boolean> {
    const isConfirmed = await this.confirm({
      level: DeleteConfirmLevel.LOW,
      subject: $localize`:@@deleteServiceSubjectCaption:Caption`,
      description: caption.text,
    });

    if (isConfirmed) {
      this.store.dispatch(
        captionsActions.remove({ removeCaptionId: caption.id })
      );
    }

    return isConfirmed;
  }

  async deleteAccount(): Promise<boolean> {
    const isConfirmed = await this.confirm({
      level: DeleteConfirmLevel.HIGH_PASSWORD,
      type: 'deleteAccount',
      subject: 'Account',
      description: $localize`:@@deleteServiceDeleteAccountDescription:If you confirm this, your account with all created projects and data will be deleted. This can NOT be undone!`,
    });

    // if (isConfirmed) {
    //   console.log('delete');
    // }

    return isConfirmed;
  }
}
