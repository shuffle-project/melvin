import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable, Subject, firstValueFrom, takeUntil } from 'rxjs';
import { TranscriptionEntity } from 'src/app/services/api/entities/transcription.entity';
import { AppState } from 'src/app/store/app.state';
import { ProjectEntity } from '../../../../../../services/api/entities/project.entity';
import * as editorSelectors from '../../../../../../store/selectors/editor.selector';
import * as transcriptionsSelectors from '../../../../../../store/selectors/transcriptions.selector';

import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ProjectDetailComponent } from 'src/app/modules/project-detail/project-detail.component';
import { CopyTranscriptionComponent } from './components/copy-transcription/copy-transcription/copy-transcription.component';
import { FromMediaTranscriptionComponent } from './components/from-media-transcription/from-media-transcriptions/from-media-transcription.component';
import { TranslateTranscriptionComponent } from './components/translate-transcription/translate-transcription/translate-transcription.component';
import { UploadTranscriptionComponent } from './components/upload-transcription/upload-transcription/upload-transcription.component';

@Component({
  selector: 'app-create-transcription-dialog',
  templateUrl: './create-transcription-dialog.component.html',
  styleUrls: ['./create-transcription-dialog.component.scss'],
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatTabsModule,
    CopyTranscriptionComponent,
    TranslateTranscriptionComponent,
    UploadTranscriptionComponent,
    FromMediaTranscriptionComponent,
  ],
})
export class CreateTranscriptionDialogComponent implements OnInit, OnDestroy {
  private destroy$$ = new Subject<void>();

  public loading = false;

  tabs = ['upload', 'copy', 'translate', 'from media'];
  selectedTab = 'upload';

  @ViewChild('uploadForm') uploadForm!: UploadTranscriptionComponent;
  @ViewChild('copyForm') copyForm!: CopyTranscriptionComponent;
  @ViewChild('asrForm') asrForm!: CopyTranscriptionComponent;
  @ViewChild('translateForm') translateForm!: CopyTranscriptionComponent;

  uploadProgress: number = 0;

  public transcriptionsList$: Observable<TranscriptionEntity[]>;
  public transcriptionList!: TranscriptionEntity[];
  public project!: ProjectEntity;

  dialog = inject(MatDialog);

  constructor(private store: Store<AppState>) {
    this.transcriptionsList$ = this.store.select(
      transcriptionsSelectors.selectTranscriptionList
    );
    this.transcriptionsList$
      .pipe(takeUntil(this.destroy$$))
      .subscribe((transcriptionList) => {
        this.transcriptionList = transcriptionList;
      });
  }

  async ngOnInit() {
    this.project = (await firstValueFrom(
      this.store.select(editorSelectors.selectProject)
    )) as ProjectEntity;
  }

  ngOnDestroy() {
    this.destroy$$.next();
  }

  onSelectedTabChange(index: number) {
    this.selectedTab = this.tabs[index];
  }

  onSubmitCurrentTabForm() {
    switch (this.selectedTab) {
      case 'upload':
        this.uploadForm.submit(this.project.id);
        break;
      case 'copy':
        this.copyForm.submit(this.project.id);
        break;
      case 'translate':
        this.translateForm.submit(this.project.id);
        break;
      case 'from media':
        this.asrForm.submit(this.project.id);
        break;
      default:
        console.log('Missing tab handling');
    }
  }

  onLoadingEvent(loading: boolean) {
    this.loading = loading;
  }

  onCloseDialog() {
    this.dialog.open(ProjectDetailComponent, {
      data: { tab: 'transcription' },
      width: '100%',
      maxWidth: '700px',
      maxHeight: '90vh',
    });
  }
}
