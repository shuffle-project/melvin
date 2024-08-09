import { Component, OnDestroy, ViewChild } from '@angular/core';
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
import { ApiService } from 'src/app/services/api/api.service';
import { Language } from 'src/app/services/api/entities/config.entity';
import { AppState } from 'src/app/store/app.state';
import * as configSelector from '../../../../../store/selectors/config.selector';

interface FileGroup {
  file: FormControl<File>;
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
  ],
  templateUrl: './dialog-create-project.component.html',
  styleUrl: './dialog-create-project.component.scss',
})
export class DialogCreateProjectComponent implements OnDestroy {
  @ViewChild(MatTable) table!: MatTable<any>;
  dataSource!: MatTableDataSource<any>;
  displayedColumns: string[] = [
    'name',
    'category',
    'language',
    'use-audio',
    'delete',
  ];

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

  public formGroup = this.fb.group({
    title: this.fb.control('', {
      validators: [Validators.required],
    }),

    files: this.fb.array<FormGroup<FileGroup>>([], {
      // validators: [this.fileLanguageValidator()],
    }),
  });

  fileContentValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const videoFiles = control.value.filter(
        (file: File) =>
          file.type.includes('audio') || file.type.includes('video')
      );

      if (videoFiles.length < 1) return { videoRequired: true };
      return null;
    };
  }

  onAddFiles(event: any) {
    const files: File[] = event.target.files;
    [...files].forEach((file) => {
      const fileGroup = this.fb.group<FileGroup>({
        file: this.fb.control(file),
        name: this.fb.control(file.name),
        category: this.fb.control(''),
        language: this.fb.control(''),
        useAudio: this.fb.control(false),
      });

      this.formGroup.controls.files.push(fileGroup);
    });
    this.dataSource = new MatTableDataSource(
      (this.formGroup.controls.files as FormArray).controls
    );

    // this.table.renderRows();
  }

  onClearTitleField(event: Event) {
    event.preventDefault();
    this.formGroup.controls.title.reset();
  }

  onRemoveFile(index: number) {
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
