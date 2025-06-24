import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
  ValueChangeEvent,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatCheckboxChange,
  MatCheckboxModule,
} from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import {
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { Store } from '@ngrx/store';
import { filter, lastValueFrom, Subject, takeUntil } from 'rxjs';
import { UploadAreaComponent } from 'src/app/components/upload-area/upload-area.component';
import { UploadProgressComponent } from 'src/app/components/upload-progress/upload-progress.component';
import { MediaCategoryPipe } from 'src/app/pipes/media-category-pipe/media-category.pipe';
import { ApiService } from 'src/app/services/api/api.service';
import {
  CreateProjectDto,
  SubtitleOption,
  VideoOption,
} from 'src/app/services/api/dto/create-project.dto';
import { AsrVendors } from 'src/app/services/api/dto/create-transcription.dto';
import { MediaCategory } from 'src/app/services/api/entities/project.entity';
import { UploadHandler } from 'src/app/services/upload/upload-handler';
import { UploadService } from 'src/app/services/upload/upload.service';
import { AppState } from 'src/app/store/app.state';
import { LanguageAutocompleteComponent } from '../../../../../components/language-autocomplete/language-autocomplete/language-autocomplete.component';
import * as configSelectors from '../../../../../store/selectors/config.selector';
export interface CreateProjectFormGroup {
  title: FormControl<string>;
  files: FormArray<FormGroup<FileGroup>>;
}

interface FileGroup {
  file: FormControl<File>;
  fileType: FormControl<'text' | 'video'>;
  name: FormControl<string>;
  category: FormControl<string>;
  language: FormControl<string>;
  useAudio: FormControl<boolean>;
}

@Component({
  selector: 'app-dialog-create-project',
  imports: [
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatTableModule,
    MatSelectModule,
    MatCheckboxModule,
    MediaCategoryPipe,
    MatProgressBarModule,
    UploadProgressComponent,
    UploadAreaComponent,
    LanguageAutocompleteComponent,
  ],
  templateUrl: './dialog-create-project.component.html',
  styleUrl: './dialog-create-project.component.scss',
})
export class DialogCreateProjectComponent implements OnDestroy, AfterViewInit {
  @ViewChild(MatTable) table!: MatTable<any>;
  dataSource!: MatTableDataSource<any>;
  displayedColumns: string[] = [
    'name',
    'category',
    'language',
    'use-audio',
    'delete',
  ];

  uploadAreaFormGroup = new FormGroup({
    files: new FormControl<File[]>([], {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  acceptedFileFormats: string[] = [
    'audio',
    'video',
    'audio/*',
    'video/*',
    '.srt',
    '.vtt',
  ];

  fileFormatsLabel = 'MP4, WebM, MP3, WAV, SRT, VTT';

  // calculate eta
  timeStarted!: number;
  eta: undefined | number = undefined;

  error: HttpErrorResponse | null = null;

  MediaCategory = MediaCategory;
  mediaCategoryArray = Object.entries(MediaCategory)
    .map(([label, value]) => value)
    .filter((category) => category !== MediaCategory.MAIN);

  private destroy$$ = new Subject<void>();

  languages!: { code: string; name: string }[];
  locale = $localize.locale;

  loading = false;

  uploadHandlers: UploadHandler[] = [];

  constructor(
    private fb: NonNullableFormBuilder,
    private api: ApiService,
    private store: Store<AppState>,
    private dialogRef: MatDialogRef<DialogCreateProjectComponent>,
    private uploadService: UploadService
  ) {
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
  }

  ngAfterViewInit(): void {
    this.uploadAreaFormGroup.valueChanges
      .pipe(takeUntil(this.destroy$$))
      .subscribe((value) => {
        const { files } = value;
        if (files?.length === 0) return;

        this.addFiles(files!);
        this.uploadAreaFormGroup.reset();
      });

    this.formGroup.events
      .pipe(
        filter((e) => e instanceof ValueChangeEvent),
        takeUntil(this.destroy$$)
      )
      .subscribe((e: any) => {
        const source = e.source as FormGroup;
        const sourceParent = source.parent as FormGroup<FileGroup>;

        if (sourceParent === null || !sourceParent.controls.language) return;

        if (this.languages.map((l) => l.code).includes(source.value)) {
          if (
            !sourceParent.controls.language.disabled &&
            sourceParent.controls.fileType.value === 'video'
          ) {
            this.formGroup.controls.files.controls.forEach((fileGroup) => {
              if (
                fileGroup.value.name !== sourceParent.value.name &&
                fileGroup.value.fileType === 'video'
              ) {
                fileGroup.controls.language.disable();
                fileGroup.controls.language.setValue(source.value);
              }
            });

            this.dataSource = new MatTableDataSource(
              (this.formGroup.controls.files as FormArray).controls
            );
          }
        }
      });
  }

  onChangeUseAudio(e: MatCheckboxChange, name: string) {
    if (e.checked && this.formGroup.controls.title.value === '') {
      const cleanName = name.replace(/\.[^/.]+$/, '');
      this.formGroup.controls.title.setValue(cleanName);
    }
  }

  public formGroup: FormGroup<CreateProjectFormGroup> = this.fb.group(
    {
      title: this.fb.control('', {
        validators: [Validators.required],
      }),

      files: this.fb.array<FormGroup<FileGroup>>([], {}),
    },
    { validators: [this.fileContentValidator()] }
  );

  fileContentValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const c = control as FormGroup<CreateProjectFormGroup>;
      const f = c.controls.files as FormArray<FormGroup<FileGroup>>;

      const atLeastOneVideoOrAudio = f.value.some((fileGroup) => {
        return fileGroup.fileType?.includes('video');
      });

      if (!atLeastOneVideoOrAudio && control.touched)
        return { videoRequired: true };

      if (f.length >= 2) {
        const fileNameSet = new Set();

        f.value.forEach((fileGroup) => {
          fileNameSet.add(fileGroup.file!.name);
        });

        if (fileNameSet.size !== f.length) return { duplicateFiles: true };
      }

      const atLeastOneUseAudioChecked = f.value.some((fileGroup) => {
        return fileGroup.useAudio;
      });

      const atLeastOneUseAudioTouched = f.controls.some((fileGroup) => {
        return fileGroup.controls.useAudio.touched;
      });

      if (
        atLeastOneVideoOrAudio &&
        !atLeastOneUseAudioChecked &&
        atLeastOneUseAudioTouched
      )
        return { useAudioRequired: true };
      return null;
    };
  }

  addFiles(files: File[]) {
    // TODO snackbar with allowed file formats if wrong format submitted?
    const onlyValidFiles = [...files].filter((file: File) => {
      return this.acceptedFileFormats.find((acceptedFormat) => {
        if (acceptedFormat.includes('.')) {
          return file.name.endsWith(acceptedFormat);
        } else {
          return file.type.includes(acceptedFormat);
        }
      });
    });

    const alreadySelectedLanguage =
      this.formGroup.controls.files.value.find((f) => {
        if (f.language === undefined) return false;
        return f.language !== '';
      }) || '';

    const languageControl = alreadySelectedLanguage
      ? { value: alreadySelectedLanguage.language!, disabled: true }
      : '';

    onlyValidFiles.forEach((file) => {
      if (file.type.includes('audio') || file.type.includes('video')) {
        const findLastVideo = this.formGroup.controls.files.value
          .map((f) => f.fileType)
          .lastIndexOf('video');

        const insertIndex = findLastVideo === -1 ? 0 : findLastVideo + 1;

        const fileGroup = this.fb.group<FileGroup>({
          file: this.fb.control(file),
          fileType: this.fb.control('video'),
          name: this.fb.control(file.name),
          category: this.fb.control('', [Validators.required]),
          language: this.fb.control(languageControl, [Validators.required]),
          useAudio: this.fb.control(false),
        });

        this.formGroup.controls.files.insert(insertIndex, fileGroup);
      } else {
        const fileGroup = this.fb.group<FileGroup>({
          file: this.fb.control(file),
          fileType: this.fb.control('text'),
          name: this.fb.control(file.name),
          category: this.fb.control(''),
          language: this.fb.control('', [Validators.required]),
          useAudio: this.fb.control(false),
        });

        this.formGroup.controls.files.push(fileGroup);
      }
    });

    this.dataSource = new MatTableDataSource(
      (this.formGroup.controls.files as FormArray).controls
    );
  }

  onClearTitleField(event: Event) {
    event.preventDefault();
    this.formGroup.controls.title.reset();
  }

  onRemoveFile(index: number, event: any) {
    if (
      !this.formGroup.controls.files.controls[index].controls.language.disabled
    ) {
      let reabledLanguage = false;
      this.formGroup.controls.files.controls.forEach((fileGroup, i) => {
        if (!reabledLanguage && fileGroup.controls.language.disabled) {
          fileGroup.controls.language.enable();
          reabledLanguage = true;
        }
      });
    }

    this.formGroup.markAsTouched();
    this.formGroup.controls.files.removeAt(index);

    if (this.formGroup.controls.files.value.length === 0) {
      this.uploadAreaFormGroup.markAllAsTouched();
      this.uploadAreaFormGroup.updateValueAndValidity();
    }

    this.dataSource = new MatTableDataSource(
      (this.formGroup.controls.files as FormArray).controls
    );
  }

  onPreventBubble(event: any) {
    if (event.target.type !== 'checkbox') {
      event.preventDefault();
    }
  }

  async onSubmitForm() {
    this.formGroup.controls.files.getRawValue().forEach((fileGroup) => {
      console.log(fileGroup);
    });

    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      this.formGroup.updateValueAndValidity();
      this.uploadAreaFormGroup.markAllAsTouched();
      this.uploadAreaFormGroup.updateValueAndValidity();
      return;
    }

    this.loading = true;

    try {
      const allFiles = this.formGroup.controls.files.getRawValue();
      allFiles.forEach((f) => {
        this.uploadHandlers.push(this.uploadService.createUpload(f.file));
      });

      for (const handler of this.uploadHandlers) {
        await handler.start();
      }

      const subtitleFiles = allFiles.filter((f) => f.fileType === 'text');
      const subtitleOptions: SubtitleOption[] = subtitleFiles.map((f) => ({
        language: f.language,
        uploadId: this.uploadHandlers.find(
          (uploadHandler) => uploadHandler.file.name === f.name
        )!.progress$.value.uploadId!,
      }));

      const videoFiles = allFiles.filter((f) => f.fileType === 'video');
      const videoOptions: VideoOption[] = videoFiles.map((f) => ({
        category: f.category,
        useAudio: f.useAudio,
        uploadId: this.uploadHandlers.find(
          (uploadHandler) => uploadHandler.file.name === f.name
        )!.progress$.value.uploadId!,
      }));

      const createProjectDto: CreateProjectDto = {
        asrVendor: AsrVendors.WHISPER,
        title: this.formGroup.controls.title.getRawValue(),
        language: this._getMainLanguage(this.formGroup),
        videoOptions,
        subtitleOptions:
          subtitleOptions.length > 0 ? subtitleOptions : undefined, // TODO fill
        sourceMode: 'video',
      };

      await lastValueFrom(this.api.createProject(createProjectDto));

      this.loading = false;
      this.dialogRef.close();
    } catch (error) {
      // TODO error
      this.loading = false;
      this.formGroup.enable();

      // should always be an HttpErrorResponse
      this.error = error as HttpErrorResponse;
      console.log('error in project creation', error);
    }
  }

  public _getMainLanguage(formGroup: FormGroup<CreateProjectFormGroup>) {
    const useAudioFiles = formGroup.controls.files
      .getRawValue()
      .filter((f) => f.useAudio);

    return useAudioFiles[0].language;
  }

  ngOnDestroy() {
    this.destroy$$.next();
  }

  async onCancelUpload() {
    try {
      for (const handler of this.uploadHandlers) {
        const handlerProgress = handler.progress$.value;

        if (handlerProgress.status === 'uploading') {
          handler.cancel$$.next();
          await lastValueFrom(this.api.cancelUpload(handlerProgress.uploadId!));
        }
      }
    } finally {
      this.dialogRef.close();
    }
  }
}
