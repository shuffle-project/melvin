import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable, Subject, firstValueFrom, takeUntil } from 'rxjs';
import { TranscriptionEntity } from 'src/app/services/api/entities/transcription.entity';
import { AppState } from 'src/app/store/app.state';
import { ApiService } from '../../../../../../services/api/api.service';
import { ProjectEntity } from '../../../../../../services/api/entities/project.entity';
import * as editorSelectors from '../../../../../../store/selectors/editor.selector';
import * as transcriptionsSelectors from '../../../../../../store/selectors/transcriptions.selector';

import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
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

  constructor(
    private store: Store<AppState>,
    private dialogRef: MatDialogRef<CreateTranscriptionDialogComponent>,
    private dialog: MatDialog,
    private api: ApiService
  ) {
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

  //   onValidInputForCreateOption() {
  //     const createOption = this.transcriptionGroup.value.createOption;
  //     const input = this.transcriptionGroup.controls;

  //     const title = input['title'].valid;
  //     const language = input['language'].valid;
  //     const transcription = input['transcription'].valid;
  //     const asrVendor = input['asrVendor'].valid;
  //     const translationVendor = input['translationVendor'].valid;
  //     const transcriptionFiles = input['transcriptionFiles'].valid;
  //     const videoFiles = input['videoFiles'].valid;

  //     switch (createOption) {
  //       case 'upload-transcript':
  //         return title && language && transcriptionFiles;
  //       case 'copy-transcript':
  //         return title && transcription;
  //       case 'translate-transcript':
  //         return title && transcription && translationVendor && language;
  //       case 'create-from-video':
  //         return title && videoFiles && asrVendor && language;
  //       default:
  //         return false;
  //     }
  //   }

  //   async onCreateTranscription() {
  //     const valid = this.onValidInputForCreateOption();

  //     if (!valid) {
  //       this.transcriptionGroup.markAllAsTouched();
  //       return;
  //     }

  //     const {
  //       title,
  //       language,
  //       transcription,
  //       asrVendor,
  //       createOption,
  //       transcriptionFiles,
  //       translationVendor,
  //       videoFiles,
  //     } = this.transcriptionGroup.getRawValue();

  //     let newTranscription: CreateTranscriptionDto = {
  //       project: this.project.id,
  //       title,
  //       language,
  //     };

  //     switch (createOption) {
  //       case 'copy-transcript':
  //         const transcriptionId = transcription;
  //         newTranscription.copyDto = {
  //           sourceTranscriptionId: transcriptionId,
  //         };
  //         // const source = this.transcriptionsList.find(
  //         //   (obj) => obj.id === transcriptionId
  //         // );
  //         // if (source) newTranscription.language = source.language;
  //         break;
  //       case 'translate-transcript':
  //         if (translationVendor)
  //           // alsways true cause of validator
  //           newTranscription.translateDto = {
  //             sourceTranscriptionId: transcription,
  //             targetLanguage: language,
  //             vendor: translationVendor,
  //           };
  //         break;
  //       case 'upload-transcript':
  //         // call apiService directly in next step
  //         break;
  //       default:
  //         break;
  //     }

  //     if (newTranscription.copyDto || newTranscription.translateDto) {
  //       // dont call the action if files are involved
  //       this.store.dispatch(transcriptionsActions.create({ newTranscription }));
  //     } else {
  //       this.loading = true;
  //       const res = await new Promise((resolve, reject) => {
  //         const file = transcriptionFiles[0];
  //         this.api.createTranscriptionFromFile(newTranscription, file).subscribe({
  //           next: (event: HttpEvent<TranscriptionEntity>) => {
  //             if (event.type === HttpEventType.UploadProgress) {
  //               this.uploadProgress =
  //                 (event.loaded / (event.total ? event.total : file.size)) * 100;
  //             } else if (event.type === HttpEventType.Response) {
  //               resolve(event);
  //             }
  //           },
  //           error: (error: HttpErrorResponse) => {
  //             console.log(error); // TODO handle error
  //             reject(error);
  //           },
  //         });
  //       });
  //       this.loading = false;
  //     }

  //     this.dialogRef.close();
  //     this.dialog.open(ProjectDetailComponent, {
  //       data: { projectId: this.project.id, tab: 'transcription' },
  //       width: '70%',
  //       height: '70vh',
  //     });
  //   }
}
