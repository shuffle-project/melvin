import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { lastValueFrom, map, Subject, takeUntil } from 'rxjs';
import { WrittenOutLanguagePipe } from 'src/app/pipes/written-out-language-pipe/written-out-language.pipe';
import { AlertService } from 'src/app/services/alert/alert.service';
import { ApiService } from 'src/app/services/api/api.service';
import { TranscriptionEntity } from 'src/app/services/api/entities/transcription.entity';
import { ProjectEntity } from '../../services/api/entities/project.entity';
import * as projectsActions from '../../store/actions/projects.actions';
import * as transcriptionsActions from '../../store/actions/transcriptions.actions';
import { AppState } from '../../store/app.state';
import * as authSelectors from '../../store/selectors/auth.selector';
import { DeleteConfirmationDialogComponent } from './delete-confirmation-dialog.component';

export enum DeleteConfirmLevel {
  LOW = 'low',
  HIGH_PASSWORD = 'high-password',
  HIGH_TYPE = 'high-type',
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
    private writtenOutLanguagePipe: WrittenOutLanguagePipe,
    private alertService: AlertService
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
        const error = (err as HttpErrorResponse).message;
        console.log(error);
        this.alertService.error(
          $localize`:@@deleteServiceLeaveProjectError:Error leaving project, try again later.`
        );
      }
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

  async adminDeleteAccount(userEmail: string): Promise<boolean> {
    const isConfirmed = await this.confirm({
      level: DeleteConfirmLevel.HIGH_TYPE,
      type: 'deleteAccount',
      subject: $localize`:@@deleteServiceAdminDeleteAccountSubject:User Account: ${userEmail}`,
      description: $localize`:@@deleteServiceAdminDeleteAccountDescription:If you confirm this, the account with all created projects and data will be deleted. This can NOT be undone!`,
    });

    return isConfirmed;
  }

  async adminDeleteTeam(teamname: string): Promise<boolean> {
    const isConfirmed = await this.confirm({
      level: DeleteConfirmLevel.HIGH_TYPE,
      subject: $localize`:@@deleteServiceAdminDeleteTeamSubject:Teamname: ${teamname}`,
      description: $localize`:@@deleteServiceAdminDeleteTeamDescription:If you confirm this, this team will be deleted and users with that team will no longer have a size limit!`,
    });

    return isConfirmed;
  }
}
