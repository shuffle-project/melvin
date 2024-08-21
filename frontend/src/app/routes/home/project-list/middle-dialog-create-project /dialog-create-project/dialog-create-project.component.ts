import {
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
} from '@angular/common/http';
import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { MediaCategoryPipe } from 'src/app/pipes/media-category-pipe/media-category.pipe';
import { ApiService } from 'src/app/services/api/api.service';
import { Language } from 'src/app/services/api/entities/config.entity';
import {
  MediaCategory,
  ProjectEntity,
} from 'src/app/services/api/entities/project.entity';
import { CreateProjectService } from 'src/app/services/create-project/create-project.service';
import { AppState } from 'src/app/store/app.state';
import * as configSelector from '../../../../../store/selectors/config.selector';

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
  standalone: true,
  imports: [
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatTableModule,
    MatSelectModule,
    MatCheckboxModule,
    PushPipe,
    MediaCategoryPipe,
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

  acceptedFileFormats: string[] = [
    'audio',
    'video',
    'audio/*',
    'video/*',
    '.srt',
    '.vtt',
  ];

  // calculate eta
  timeStarted!: number;
  eta: undefined | number = undefined;

  error: HttpErrorResponse | null = null;

  fileUploadProgress = 0; // value from 0 to 100
  uploadSubscription!: Subscription;
  private totalFileSize = 0;

  mediaCategoryArray = Object.entries(MediaCategory).map(
    ([label, value]) => value
  );

  private destroy$$ = new Subject<void>();
  languages$ = this.store.select(configSelector.languagesConfig);
  languages!: Language[];

  loading = false;

  constructor(
    private fb: NonNullableFormBuilder,
    private api: ApiService,
    private store: Store<AppState>,
    private createProjectService: CreateProjectService,
    private dialogRef: MatDialogRef<DialogCreateProjectComponent>
  ) {
    this.languages$.pipe(takeUntil(this.destroy$$)).subscribe((languages) => {
      this.languages = languages;
    });
  }

  ngAfterViewInit(): void {
    this.formGroup.controls.files.valueChanges
      .pipe(takeUntil(this.destroy$$))
      .subscribe((files) => {
        files.forEach((f) => {
          if (
            (f.file?.type.includes('audio') ||
              f.file?.type.includes('video')) &&
            this.formGroup.controls.title.value === '' &&
            f.useAudio
          ) {
            const cleanName = f.name!.replace(/\.[^/.]+$/, '');
            this.formGroup.controls.title.setValue(cleanName);
          }
        });
      });
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

  fileContentValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const c = control as FormGroup<CreateProjectFormGroup>;
      const f = c.controls.files as FormArray<FormGroup<FileGroup>>;

      const atLeastOneVideoOrAudio = f.value.some((fileGroup) => {
        return fileGroup.fileType?.includes('video');
      });

      const atLeastOneUseAudioChecked = f.value.some((fileGroup) => {
        return fileGroup.useAudio;
      });

      const atLeastOneUseAudioTouched = f.controls.some((fileGroup) => {
        return fileGroup.controls.useAudio.touched;
      });

      if (!atLeastOneVideoOrAudio && control.touched)
        return { videoRequired: true };
      if (
        atLeastOneVideoOrAudio &&
        !atLeastOneUseAudioChecked &&
        atLeastOneUseAudioTouched
      )
        return { useAudioRequired: true };
      return null;
    };
  }

  onAddFiles(event: any) {
    this.formGroup.markAsTouched();
    const files: File[] = event.target.files;

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

    onlyValidFiles.forEach((file) => {
      const fileGroup = this.fb.group<FileGroup>({
        file: this.fb.control(file),
        fileType: this.fb.control(
          file.type.includes('audio') || file.type.includes('video')
            ? 'video'
            : 'text'
        ),
        name: this.fb.control(file.name),
        category: this.fb.control(''),
        language: this.fb.control(''),
        useAudio: this.fb.control(false),
      });

      this.formGroup.controls.files.push(fileGroup);
    });

    if (this.formGroup.controls.files.length >= 2) {
      const unsortedFormGroup = this.formGroup.controls.files.value;
      const sortedFormGroup = unsortedFormGroup.sort((a, b) => {
        return a.fileType === 'video' ? -1 : 1;
      });

      this.formGroup.controls.files.reset({
        ...sortedFormGroup,
      });
    }

    this.dataSource = new MatTableDataSource(
      (this.formGroup.controls.files as FormArray).controls
    );
  }

  onClearTitleField(event: Event) {
    event.preventDefault();
    this.formGroup.controls.title.reset();
  }

  onRemoveFile(index: number) {
    this.formGroup.markAsTouched();
    this.formGroup.controls.files.removeAt(index);

    this.dataSource = new MatTableDataSource(
      (this.formGroup.controls.files as FormArray).controls
    );
  }

  onPreventBubble(event: any) {
    if (event.target.type !== 'checkbox') {
      event.preventDefault();
    }
  }

  onSubmitForm() {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      this.formGroup.updateValueAndValidity();
      return;
    }

    this.loading = true;
    const formData = this.createProjectService.create(this.formGroup);

    this.timeStarted = Date.now();
    // this.uploadSubscription = this.api.createProject(formData).subscribe({
    //   next: (event: HttpEvent<ProjectEntity>) => this._handleHttpEvent(event),
    //   error: (error: HttpErrorResponse) => this._handleErrorHttpEvent(error),
    // });
  }

  private _handleHttpEvent(event: HttpEvent<ProjectEntity>) {
    switch (event.type) {
      case HttpEventType.UploadProgress:
        this.fileUploadProgress = (event.loaded / this.totalFileSize) * 100;

        const timeElapsedInSeconds = (Date.now() - this.timeStarted) / 1000;
        const uploadSpeedInSeconds = event.loaded / timeElapsedInSeconds;

        this.eta = (this.totalFileSize - event.loaded) / uploadSpeedInSeconds;

        break;
      case HttpEventType.Response:
        // TODO maybe call store method?? -> user will get the ws eveent anyways
        this.loading = false;
        this.dialogRef.close();
        break;
      default:
        break;
    }
  }

  private _handleErrorHttpEvent(error: HttpErrorResponse) {
    this.loading = false;
    this.formGroup.enable();

    this.error = error;
    console.log('error in project creation', error);
  }

  ngOnDestroy() {
    this.destroy$$.next();
  }
}
