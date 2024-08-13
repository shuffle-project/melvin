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
import { MatDialogModule } from '@angular/material/dialog';
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
import { Subject, takeUntil } from 'rxjs';
import { MediaCategoryPipe } from 'src/app/pipes/media-category-pipe/media-category.pipe';
import { ApiService } from 'src/app/services/api/api.service';
import { Language } from 'src/app/services/api/entities/config.entity';
import { MediaCategory } from 'src/app/services/api/entities/project.entity';
import { AppState } from 'src/app/store/app.state';
import * as configSelector from '../../../../../store/selectors/config.selector';

interface DropZoneFormGroup {
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
    private store: Store<AppState>
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

  public formGroup = this.fb.group(
    {
      title: this.fb.control('', {
        validators: [Validators.required],
      }),

      files: this.fb.array<FormGroup<FileGroup>>([], {
        // validators: [],
      }),
    },
    { validators: [this.fileContentValidator()] }
  );

  fileContentValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const c = control as FormGroup<DropZoneFormGroup>;
      const f = c.controls.files as FormArray<FormGroup<FileGroup>>;

      const atLeastOneVideoOrAudio = f.value.some((fileGroup) => {
        return fileGroup.fileType?.includes('video');
      });

      const atLeastOneUseAudioChecked = f.value.some((fileGroup) => {
        return fileGroup.useAudio;
      });

      const atLeastOneUseAudioDirty = f.controls.some((fileGroup) => {
        return fileGroup.controls.useAudio.dirty;
      });

      if (!atLeastOneVideoOrAudio && control.dirty)
        return { videoRequired: true };
      if (
        atLeastOneVideoOrAudio &&
        !atLeastOneUseAudioChecked &&
        atLeastOneUseAudioDirty
      )
        return { useAudioRequired: true };
      return null;
    };
  }

  onAddFiles(event: any) {
    this.formGroup.markAsDirty();
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
    this.formGroup.markAsDirty();
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

  ngOnDestroy() {
    this.destroy$$.next();
  }
}
