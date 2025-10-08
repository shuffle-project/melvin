
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';
import { UploadProgressComponent } from 'src/app/components/upload-progress/upload-progress.component';
import {
  CreateProjectDto,
  VideoOption,
} from 'src/app/services/api/dto/create-project.dto';
import { UploadHandler } from 'src/app/services/upload/upload-handler';
import { UploadService } from 'src/app/services/upload/upload.service';
import { ApiService } from '../../../../../services/api/api.service';
import { AsrVendors } from '../../../../../services/api/dto/create-transcription.dto';
import { AsrServiceConfig } from '../../../../../services/api/entities/config.entity';
import { AppState } from '../../../../../store/app.state';
import * as configSelectors from '../../../../../store/selectors/config.selector';
import { asrServiceConfig } from '../../../../../store/selectors/config.selector';
import { Recording } from '../../recorder.interfaces';
@Component({
  selector: 'app-upload-recording',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    ReactiveFormsModule,
    UploadProgressComponent,
    MatProgressSpinnerModule
],
  templateUrl: './upload-recording.component.html',
  styleUrl: './upload-recording.component.scss',
})
export class UploadRecordingComponent implements OnInit {
  readyToUpload = false;
  uploading = false;
  uploadingDone = false;
  uploadingError = false;

  asrServiceConfig$ = this.store.select(asrServiceConfig);
  asrSelection!: AsrServiceConfig;

  languages!: { code: string; name: string }[];
  locale = $localize.locale;
  destroy$$ = new Subject<void>();

  public formGroup: FormGroup = this.fb.group({
    language: this.fb.control('', Validators.required),
  });

  uploadHandlers: UploadHandler[] = [];

  constructor(
    public dialogRef: MatDialogRef<UploadRecordingComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { title: string; recordings: Recording[] },
    public api: ApiService,
    public store: Store<AppState>,
    private router: Router,
    private fb: NonNullableFormBuilder,
    private uploadService: UploadService
  ) {}

  async ngOnInit() {
    this.store
      .select(configSelectors.getSupportedASRLanguages)
      .pipe(takeUntil(this.destroy$$))
      .subscribe((languages) => {
        this.languages = languages
          .map((language) => {
            return {
              code: language.code,
              name: this.locale?.startsWith('en')
                ? language.englishName
                : language.germanName,
            };
          })
          .sort((a, b) => {
            return a.name.localeCompare(b.name);
          });
      });

    const timer = setInterval(() => {
      this.checkReady();
      if (this.readyToUpload) {
        clearInterval(timer);

        this.data.recordings.forEach((rec) => {
          const recFile = new File(rec.chunks, 'video.webm', {
            type: 'video/webm',
          });

          this.uploadHandlers.push(this.uploadService.createUpload(recFile));
        });
      }
    }, 1000);
  }

  checkReady() {
    this.readyToUpload = this.data.recordings.every(
      (recording) => recording.complete
    );
  }

  async onClose(toProjectlist = false) {
    for (const handler of this.uploadHandlers) {
      const handlerProgress = handler.progress$.value;

      if (handlerProgress.status === 'uploading') {
        handler.cancel$$.next();
        await lastValueFrom(this.api.cancelUpload(handlerProgress.uploadId!));
      }
    }

    this.dialogRef.close();

    if (toProjectlist) {
      this.router.navigate(['home']);
    }
  }

  async onUploadRecording() {
    if (!this.formGroup.value.language) {
      this.formGroup.controls['language'].markAsTouched();
      return;
    }

    this.uploading = true;

    try {
      for (const handler of this.uploadHandlers) {
        await handler.start();
      }
      const videoOptions: VideoOption[] = [];
      this.data.recordings.forEach((rec, i) => {
        videoOptions.push({
          uploadId: this.uploadHandlers[i].progress$.value.uploadId!,
          category: rec.category,
          useAudio: i === 0,
        });
      });

      const createProjectDto: CreateProjectDto = {
        asrVendor: AsrVendors.WHISPER,
        title: this.data.title,
        language: this.formGroup.value.language,
        videoOptions, // TODO fill
        subtitleOptions: undefined,
        sourceMode: 'video',
        recorder: true,
      };

      const project = await lastValueFrom(
        this.api.createProject(createProjectDto)
      );

      this.uploadingDone = true;
    } catch (error) {
      console.error(error);

      if (error instanceof HttpErrorResponse)
        // not visible anymore with new upload component, needs discussion
        // this.data.recordings[0].upload.error = error;

        this.uploadingError = true;
    }
  }

  onDownloadVideoLocally(file: File) {
    const filename = file.name.replace(/\s/g, '_');

    const objectURL = window.URL.createObjectURL(file);
    const downloadElement = document.createElement('a');
    downloadElement.href = objectURL;
    downloadElement.download = filename;
    downloadElement.click();
    downloadElement.remove();
    window.URL.revokeObjectURL(objectURL);
  }

  ngOnDestroy() {
    this.destroy$$.next();
  }
}
