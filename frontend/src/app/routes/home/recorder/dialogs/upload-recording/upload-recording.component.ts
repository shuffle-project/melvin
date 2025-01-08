import { CommonModule } from '@angular/common';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
} from '@angular/common/http';
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
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { Subject, take, takeUntil } from 'rxjs';
import { WrittenOutLanguagePipe } from 'src/app/pipes/written-out-language-pipe/written-out-language.pipe';
import { ApiService } from '../../../../../services/api/api.service';
import { AsrVendors } from '../../../../../services/api/dto/create-transcription.dto';
import { UploadVideoDto } from '../../../../../services/api/dto/upload-video.dto';
import {
  AsrServiceConfig,
  LanguageShort,
} from '../../../../../services/api/entities/config.entity';
import { ProjectEntity } from '../../../../../services/api/entities/project.entity';
import { AppState } from '../../../../../store/app.state';
import * as configSelectors from '../../../../../store/selectors/config.selector';
import { asrServiceConfig } from '../../../../../store/selectors/config.selector';
import { Recording } from '../../recorder.interfaces';
@Component({
  selector: 'app-upload-recording',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    WrittenOutLanguagePipe,
    ReactiveFormsModule,
    PushPipe,
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

  constructor(
    public dialogRef: MatDialogRef<UploadRecordingComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { title: string; recordings: Recording[] },
    public api: ApiService,
    public store: Store<AppState>,
    private router: Router,
    private fb: NonNullableFormBuilder
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
      }
    }, 1000);
  }

  checkReady() {
    this.readyToUpload = this.data.recordings.every(
      (recording) => recording.complete
    );
  }
  onClose(toProjectlist = false) {
    this.dialogRef.close();
    if (toProjectlist) {
      this.router.navigate(['home']);
    }
  }

  onChangeAsrService(change: MatSelectChange) {
    const languages: LanguageShort[] = change.value.languages;

    // choose same language again if it is possible for the new asrservice
    const prev = languages.find(
      (l) => l.code === this.formGroup.value.language
    );
    if (prev) {
      this.formGroup.value.language = prev.code;
    } else if (languages.length > 0) {
      // choose first language (should always be possible)
      this.formGroup.value.language = languages[0].code;
    }
  }

  selectInitalInputs() {
    this.asrServiceConfig$.pipe(take(1)).subscribe((configs) => {
      // preselect asr config
      const whisperConfig = configs.find(
        (config) => config.asrVendor === AsrVendors.WHISPER
      );
      if (whisperConfig) {
        this.asrSelection = whisperConfig;
        // this.language = whisperConfig.languages[0].code;
      } else if (configs.length > 0) {
        this.asrSelection = configs[0];
        // this.language = configs[0].languages[0].code;
      }
    });
  }

  async onUploadRecording() {
    if (!this.formGroup.value.language) {
      this.formGroup.controls['language'].markAsTouched();
      return;
    }

    this.uploading = true;

    const newProject: ProjectEntity = await this.createProject(
      this.data.recordings[0],
      this.data.title,
      this.formGroup.value.language
    );

    this.data.recordings.forEach((rec, i) => {
      if (i === 0) return;
      this.uploadAdditionalFile(rec, newProject);
    });
  }

  buildFormData(recording: Recording, title: string, language: string) {
    const data = {
      title: title,
      language: language,
      sourceMode: 'video',
      asrVendor: AsrVendors.WHISPER,
      asrLanguage: language,
      videoLanguage: language,
    };

    const formData: FormData = new FormData();
    Object.entries(data).forEach((o) => {
      const key = o[0];
      const value = o[1];
      formData.append(key, value);
    });

    const file = new File(
      recording.chunks.splice(0, recording.chunks.length),
      'video.webm',
      {
        type: 'video/webm',
      }
    );

    formData.append('video', file, 'video.webm');
    return formData;
  }

  displayCompleteUploadProgress() {
    return (
      this.data.recordings
        .map((rec) => rec.upload.progress)
        .reduce((v1, v2) => v1 + v2) / this.data.recordings.length
    );
  }

  onDownloadVideosLocally() {
    this.data.recordings.forEach((rec, i) => {
      this.onDownloadVideoLocally(rec, i);
    });
  }

  onDownloadVideoLocally(rec: Recording, i = -1) {
    const prefix = i < 0 ? '' : i + 1 + '_';
    const filename = prefix + rec.title.replace(/\s/g, '_') + '.webm';
    const file = new File(rec.chunks.splice(0, rec.chunks.length), filename, {
      type: 'video/webm',
    });
    const objectURL = window.URL.createObjectURL(file);
    const downloadElement = document.createElement('a');
    downloadElement.href = objectURL;
    downloadElement.download = filename;
    // downloadElement.target ='_blank'
    downloadElement.click();
    downloadElement.remove();
    window.URL.revokeObjectURL(objectURL);
  }

  async createProject(rec: Recording, title: string, language: string) {
    const formData: FormData = this.buildFormData(rec, title, language);

    this.api.createLegacyProject(formData).subscribe({
      next: (event: HttpEvent<ProjectEntity>) =>
        this._onNextHttpEvent(event, rec),
      error: (error: HttpErrorResponse) => this._onErrorHttpEvent(rec, error),
    });

    // TODO wait until upload is done
    while (!rec.upload.result) {
      await this.waitMS(1000);
    }

    return rec.upload.result;
  }

  uploadAdditionalFile(rec: Recording, newProject: ProjectEntity) {
    const recFile = new File(rec.chunks, 'video.webm', {
      type: 'video/webm',
    });

    const uploadVideoDto: UploadVideoDto = {
      title: rec.title,
      category: rec.category,
    };

    rec.upload.progress = 0;

    this.api.uploadVideo(newProject.id, uploadVideoDto, recFile).subscribe({
      next: (event: HttpEvent<ProjectEntity>) =>
        this._onNextHttpEvent(event, rec),
      error: (error: HttpErrorResponse) => this._onErrorHttpEvent(rec, error),
    });
  }

  _onNextHttpEvent(event: HttpEvent<ProjectEntity>, rec: Recording) {
    switch (event.type) {
      case HttpEventType.UploadProgress:
        if (event.total)
          rec.upload.progress = (event.loaded / event.total) * 100;

        break;
      case HttpEventType.Response:
        rec.upload.progress = 100;
        rec.upload.result = event.body ?? undefined;

        this.checkUploadingDone();
        break;

      default:
        break;
    }
  }

  _onErrorHttpEvent(rec: Recording, error: HttpErrorResponse) {
    console.log(error);
    rec.upload.progress = 100;
    rec.upload.error = error;

    this.uploadingError = true;

    this.checkUploadingDone(true);
  }

  private async waitMS(ms: number) {
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, ms);
    });
  }

  private checkUploadingDone(error = false) {
    if (
      error ||
      this.data.recordings.every((rec) => rec.upload.progress >= 100)
    ) {
      this.uploadingDone = true;
    }
  }

  ngOnDestroy() {
    this.destroy$$.next();
  }
}
