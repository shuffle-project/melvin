import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store/app.state';
import * as transcriptionsSelectors from '../../../../store/selectors/transcriptions.selector';

import { LiveAnnouncer } from '@angular/cdk/a11y';
import { NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { firstValueFrom, lastValueFrom, Subject, take, takeUntil } from 'rxjs';
import { FormatDatePipe } from 'src/app/pipes/format-date-pipe/format-date.pipe';
import { ProjectStatusPipe } from 'src/app/pipes/project-status-pipe/project-status.pipe';
import { WrittenOutLanguagePipe } from 'src/app/pipes/written-out-language-pipe/written-out-language.pipe';
import { AlertService } from 'src/app/services/alert/alert.service';
import { ApiService } from 'src/app/services/api/api.service';
import { ProjectEntity } from 'src/app/services/api/entities/project.entity';
import {
  SubtitleFormat,
  TranscriptionEntity,
  TranscriptionStatus,
} from 'src/app/services/api/entities/transcription.entity';
import { DeleteConfirmationService } from '../../../../components/delete-confirmation-dialog/delete-confirmation.service';
import * as transcriptionsActions from '../../../../store/actions/transcriptions.actions';
import * as authSelectors from '../../../../store/selectors/auth.selector';
import * as editorSelectors from '../../../../store/selectors/editor.selector';
import { DialogProjectTranscriptionComponent } from '../../dialog-project-transcription/dialog-project-transcription.component';
import { CreateTranscriptionDialogComponent } from './components/create-transcription-dialog/create-transcription-dialog.component';
import { EditTranscriptionDialogComponent } from './components/edit-transcription-dialog/edit-transcription-dialog.component';
@Component({
  selector: 'app-project-transcription',
  templateUrl: './project-transcription.component.html',
  styleUrls: ['./project-transcription.component.scss'],
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    WrittenOutLanguagePipe,
    FormatDatePipe,
    MatMenuModule,
    MatDividerModule,
    MatChipsModule,
    NgClass,
    ProjectStatusPipe,
  ],
})
export class ProjectTranscriptionComponent
  implements AfterViewInit, OnDestroy, OnInit
{
  dataSource = new MatTableDataSource();
  destroy$$ = new Subject<void>();

  tStatus = TranscriptionStatus;

  public project!: ProjectEntity;
  private selectedTranscriptionId!: string | null;
  private transcriptions!: TranscriptionEntity[];

  public userId!: string | null;

  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = [
    'language',
    'title',
    'lastEdited',
    'createdBy',
    'more',
  ];

  constructor(
    private store: Store<AppState>,
    private dialogRefProjectTranscription: MatDialogRef<DialogProjectTranscriptionComponent>,
    private dialog: MatDialog,
    private deleteService: DeleteConfirmationService,
    private liveAnnouncer: LiveAnnouncer,
    private api: ApiService,
    private alertService: AlertService
  ) {
    this.store
      .select(transcriptionsSelectors.selectTranscriptionList)
      .pipe(takeUntil(this.destroy$$))
      .subscribe((transcriptions) => {
        this.dataSource.data = transcriptions;
        this.transcriptions = transcriptions;
      });

    this.store
      .select(transcriptionsSelectors.selectTranscriptionId)
      .pipe(takeUntil(this.destroy$$))
      .subscribe((transcriptionId) => {
        this.selectedTranscriptionId = transcriptionId;
      });
  }

  async ngOnInit() {
    this.userId = await lastValueFrom(
      this.store.select(authSelectors.selectUserId).pipe(take(1))
    );

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

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.destroy$$.next();
  }

  onClickAddTranscription() {
    this.dialogRefProjectTranscription.close();
    this.dialog.open(CreateTranscriptionDialogComponent, {
      width: '100%',
      maxWidth: '50rem',
      maxHeight: '90vh',
    });
  }

  async onClickDeleteTranscription(transcription: TranscriptionEntity) {
    if (this.project.transcriptions.length === 1) {
      const errorMessage = $localize`:@@transcriptionDeleteErrorAlert:At least one transcription is required.`;
      this.alertService.error(errorMessage);

      return;
    }

    const isConfirmed = await this.deleteService.deleteTranscription(
      transcription
    );

    if (isConfirmed && this.selectedTranscriptionId === transcription.id) {
      const toOpenTranscription = this.transcriptions.find(
        (t) => t.id !== transcription.id
      );
      this.store.dispatch(
        transcriptionsActions.selectFromEditor({
          transcriptionId: toOpenTranscription!.id,
        })
      );
    }
  }

  onOpenTranscription(transcriptionId: string) {
    this.store.dispatch(
      transcriptionsActions.selectFromEditor({ transcriptionId })
    );
    this.dialogRefProjectTranscription.close();
  }

  onClickEditTranscription(transcription: TranscriptionEntity) {
    this.dialogRefProjectTranscription.close();
    this.dialog.open(EditTranscriptionDialogComponent, {
      data: transcription,
      width: '100%',
      maxWidth: '50rem',
      maxHeight: '90vh',
    });
  }

  async onClickAlignTranscription(transcription: TranscriptionEntity) {
    await firstValueFrom(this.api.alignTranscription(transcription.id));
  }

  async onDownloadTxt(transcriptionId: string) {
    this.onDownloadSubtitles(SubtitleFormat.TXT, transcriptionId);
  }
  async onDownloadVtt(transcriptionId: string) {
    this.onDownloadSubtitles(SubtitleFormat.VTT, transcriptionId);
  }
  async onDownloadSrt(transcriptionId: string) {
    this.onDownloadSubtitles(SubtitleFormat.SRT, transcriptionId);
  }

  async onDownloadSubtitles(format: SubtitleFormat, transcriptionId: string) {
    this.store.dispatch(
      transcriptionsActions.downloadSubtitles({ transcriptionId, format })
    );
  }

  onDownloadTranscript(transcriptionId: string) {
    this.store.dispatch(
      transcriptionsActions.downloadTranscript({ transcriptionId })
    );
  }

  announceSortChange(sortState: any) {
    if (sortState.direction) {
      this.liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this.liveAnnouncer.announce('Sorting cleared');
    }
  }
}
