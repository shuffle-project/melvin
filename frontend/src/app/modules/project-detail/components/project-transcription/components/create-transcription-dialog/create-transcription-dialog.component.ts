import {
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
} from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatLegacyDialog as MatDialog, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { Store } from '@ngrx/store';
import { firstValueFrom, Observable, Subject, takeUntil } from 'rxjs';
import { LANGUAGES } from 'src/app/constants/languages.constant';
import { ProjectDetailComponent } from 'src/app/modules/project-detail/project-detail.component';
import { TranscriptionEntity } from 'src/app/services/api/entities/transcription.entity';
import { AppState } from 'src/app/store/app.state';
import { ApiService } from '../../../../../../services/api/api.service';
import {
  AsrVendors,
  CreateTranscriptionDto,
  TranslateVendors,
} from '../../../../../../services/api/dto/create-transcription.dto';
import {
  Language,
  TranslationServiceConfig,
} from '../../../../../../services/api/entities/config.entity';
import { ProjectEntity } from '../../../../../../services/api/entities/project.entity';
import * as transcriptionsActions from '../../../../../../store/actions/transcriptions.actions';
import * as configSelectors from '../../../../../../store/selectors/config.selector';
import * as editorSelectors from '../../../../../../store/selectors/editor.selector';
import * as transcriptionsSelectors from '../../../../../../store/selectors/transcriptions.selector';

@Component({
  selector: 'app-create-transcription-dialog',
  templateUrl: './create-transcription-dialog.component.html',
  styleUrls: ['./create-transcription-dialog.component.scss'],
})
export class CreateTranscriptionDialogComponent implements OnInit, OnDestroy {
  private destroy$$ = new Subject<void>();
  languages = LANGUAGES;
  public loading = false;

  uploadProgress: number = 0;

  transcriptionGroup = new FormGroup({
    title: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    language: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    createOption: new FormControl<string>('upload-transcript', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    transcription: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    asrVendor: new FormControl<AsrVendors | ''>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    translationVendor: new FormControl<TranslateVendors | ''>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    transcriptionFiles: new FormControl<File[]>([], {
      nonNullable: true,
      validators: [this.transcriptionFilesValidator],
    }),
    videoFiles: new FormControl<File[]>([], {
      nonNullable: true,
      validators: [this.videoFilesValidator],
    }),
  });

  public transcriptionsList$: Observable<TranscriptionEntity[]>;
  public transcriptionsList!: TranscriptionEntity[];
  public project!: ProjectEntity;

  public translationServices$ = this.store.select(
    configSelectors.translationServiceConfig
  );

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
        this.transcriptionsList = transcriptionList;
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

  readonly errorStateMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl) => {
      if (control.hasError('invalidEntry')) return true;
      return false;
    },
  };

  videoFilesValidator(control: any): { [key: string]: any } | null {
    const invalidFiles = control.value.filter(
      (file: File) =>
        !(file.type.includes('audio') || file.type.includes('video'))
    );

    if (invalidFiles.length > 0) {
      return { invalidFiles: true };
    }
    if (control.value.length > 1) {
      return { tooManyVideos: true };
    }
    if (control.value.length < 1) {
      return { videoRequired: true };
    }
    return null;
  }

  transcriptionFilesValidator(control: any): { [key: string]: any } | null {
    const invalidFiles = control.value.filter(
      (file: File) =>
        !(file.name.endsWith('.srt') || file.name.endsWith('.vtt'))
    );

    if (invalidFiles.length > 0) {
      return { invalidFiles: true };
    }

    if (control.value.length > 1) {
      return { tooManyTranscriptions: true };
    }
    if (control.value.length < 1) {
      return { transcriptionRequired: true };
    }
    return null;
  }

  onSelectLanguage(languageCode: string) {
    let selectedLanguage = this.languages.find(
      (language) => language.code === languageCode
    );

    let currentTitle = this.transcriptionGroup.value.title;

    let currentTitleIsALanguage = this.languages.some(
      (language) => language.name === currentTitle
    );

    if (currentTitleIsALanguage || currentTitle === '') {
      this.transcriptionGroup.controls['title'].setValue(
        selectedLanguage?.name || languageCode
      );
    }
  }

  onAddTranscriptionFiles(event: any) {
    let addedFiles = [...event.target.files];

    const invalidFiles = addedFiles.filter(
      (file: File) =>
        !(file.type.includes('audio') || file.type.includes('video'))
    );
    const { transcriptionFiles } = this.transcriptionGroup.getRawValue();
    const allFiles = [...transcriptionFiles, ...addedFiles];

    this.transcriptionGroup.controls['transcriptionFiles'].setValue(allFiles);
    this.transcriptionGroup.controls['transcriptionFiles'].markAsDirty();
  }

  onAddVideoFiles(event: any) {
    let addedFiles = [...event.target.files];

    const invalidFiles = addedFiles.filter(
      (file: File) =>
        !(file.name.endsWith('.srt') || file.name.endsWith('.vtt'))
    );

    const { videoFiles } = this.transcriptionGroup.getRawValue();
    const allFiles = [...videoFiles, ...addedFiles];

    this.transcriptionGroup.controls['videoFiles'].setValue(allFiles);
    this.transcriptionGroup.controls['videoFiles'].markAsDirty();
  }

  onRemoveFile(file: File, folder: 'transcriptionFiles' | 'videoFiles') {
    const groupValues = this.transcriptionGroup.getRawValue();
    const filteredFiles = groupValues[folder].filter(
      (o: File) => o.name !== file.name
    );
    this.transcriptionGroup.controls[folder].setValue(filteredFiles);
  }

  onValidInputForCreateOption() {
    const createOption = this.transcriptionGroup.value.createOption;
    const input = this.transcriptionGroup.controls;

    const title = input['title'].valid;
    const language = input['language'].valid;
    const transcription = input['transcription'].valid;
    const asrVendor = input['asrVendor'].valid;
    const translationVendor = input['translationVendor'].valid;
    const transcriptionFiles = input['transcriptionFiles'].valid;
    const videoFiles = input['videoFiles'].valid;

    switch (createOption) {
      case 'upload-transcript':
        return title && language && transcriptionFiles;
      case 'copy-transcript':
        return title && transcription;
      case 'translate-transcript':
        return title && transcription && translationVendor && language;
      case 'create-from-video':
        return title && videoFiles && asrVendor && language;
      default:
        return false;
    }
  }

  async onCreateTranscription() {
    const {
      title,
      language,
      transcription,
      asrVendor,
      createOption,
      transcriptionFiles,
      translationVendor,
      videoFiles,
    } = this.transcriptionGroup.getRawValue();

    let newTranscription: CreateTranscriptionDto = {
      project: this.project.id,
      title,
      language,
    };

    switch (createOption) {
      case 'copy-transcript':
        const transcriptionId = transcription;
        newTranscription.copyDto = {
          sourceTranscriptionId: transcriptionId,
        };
        const source = this.transcriptionsList.find(
          (obj) => obj.id === transcriptionId
        );
        if (source) newTranscription.language = source.language;
        break;
      case 'translate-transcript':
        if (translationVendor)
          // alsways true cause of validator
          newTranscription.translateDto = {
            sourceTranscriptionId: transcription,
            targetLanguage: language,
            vendor: translationVendor,
          };
        break;
      case 'upload-transcript':
        // call apiService directly in next step
        break;
      default:
        break;
    }

    if (newTranscription.copyDto || newTranscription.translateDto) {
      // dont call the action if files are involved
      this.store.dispatch(transcriptionsActions.create({ newTranscription }));
    } else {
      this.loading = true;
      const res = await new Promise((resolve, reject) => {
        const file = transcriptionFiles[0];
        this.api.createTranscriptionFromFile(newTranscription, file).subscribe({
          next: (event: HttpEvent<TranscriptionEntity>) => {
            if (event.type === HttpEventType.UploadProgress) {
              this.uploadProgress =
                (event.loaded / (event.total ? event.total : file.size)) * 100;
            } else if (event.type === HttpEventType.Response) {
              resolve(event);
            }
          },
          error: (error: HttpErrorResponse) => {
            console.log(error); // TODO handle error
            reject(error);
          },
        });
      });
      this.loading = false;
    }

    this.dialogRef.close();
    this.dialog.open(ProjectDetailComponent, {
      data: { projectId: this.project.id, tab: 'transcription' },
      width: '70%',
      height: '70vh',
    });
  }

  extractLanguages(
    services: TranslationServiceConfig[],
    vendor: TranslateVendors | ''
  ): Language[] {
    return (
      services.find((obj) => obj.translateVendor === vendor)?.languages || []
    );
  }
}