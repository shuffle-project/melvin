import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable, Subject, firstValueFrom, takeUntil } from 'rxjs';
import { TranscriptionEntity } from 'src/app/services/api/entities/transcription.entity';
import { AppState } from 'src/app/store/app.state';
import { ProjectEntity } from '../../../../../../services/api/entities/project.entity';
import * as editorSelectors from '../../../../../../store/selectors/editor.selector';
import * as transcriptionsSelectors from '../../../../../../store/selectors/transcriptions.selector';

import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { CopyTranscriptionComponent } from './components/copy-transcription/copy-transcription/copy-transcription.component';
import { EmptyFileTranscriptionComponent } from './components/empty-file-transcription/empty-file-transcription/empty-file-transcription.component';
import { TranslateTranscriptionComponent } from './components/translate-transcription/translate-transcription/translate-transcription.component';
import { UploadTranscriptionComponent } from './components/upload-transcription/upload-transcription/upload-transcription.component';
@Component({
  selector: 'app-create-transcription-dialog',
  templateUrl: './create-transcription-dialog.component.html',
  styleUrls: ['./create-transcription-dialog.component.scss'],
  imports: [
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatTabsModule,
    CopyTranscriptionComponent,
    UploadTranscriptionComponent,
    TranslateTranscriptionComponent,
    EmptyFileTranscriptionComponent,
  ],
})
export class CreateTranscriptionDialogComponent implements OnInit, OnDestroy {
  private destroy$$ = new Subject<void>();

  public loading = false;

  // tabs = ['upload', 'copy', 'translate', 'from media', 'empty file'];
  tabs = ['upload', 'copy', 'translate', 'empty file'];
  selectedTab = 'upload';
  selectedTabIndex = 0;

  @ViewChild('uploadForm') uploadForm!: UploadTranscriptionComponent;
  @ViewChild('copyForm') copyForm!: CopyTranscriptionComponent;
  @ViewChild('translateForm') translateForm!: CopyTranscriptionComponent;
  @ViewChild('emptyFileForm') emptyFileForm!: EmptyFileTranscriptionComponent;

  uploadProgress: number = 0;

  public transcriptionsList$: Observable<TranscriptionEntity[]>;
  public transcriptionList!: TranscriptionEntity[];
  public project!: ProjectEntity;

  dialog = inject(MatDialog);

  constructor(
    private store: Store<AppState>,
    @Inject(MAT_DIALOG_DATA) public data?: { selectedTab: string }
  ) {
    if (this.data?.selectedTab) {
      this.selectedTabIndex = this.tabs.findIndex(
        (t) => t === this.data?.selectedTab
      );
      this.selectedTab = this.tabs[this.selectedTabIndex];
    }

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
      case 'empty file':
        this.emptyFileForm.submit(this.project.id);
        break;
      default:
        console.log('Missing tab handling');
    }
  }

  onLoadingEvent(loading: boolean) {
    this.loading = loading;
  }
}
