import { CommonModule } from '@angular/common';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
} from '@angular/common/http';
import {
  Component,
  DestroyRef,
  EventEmitter,
  Output,
  inject,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { Observable, map, switchMap } from 'rxjs';
import { UploadFilesComponent } from 'src/app/components/upload-files/upload-files.component';
import { WrittenOutLanguagePipe } from 'src/app/pipes/written-out-language-pipe/written-out-language.pipe';
import { ApiService } from 'src/app/services/api/api.service';
import {
  AsrVendors,
  CreateTranscriptionDto,
} from 'src/app/services/api/dto/create-transcription.dto';
import { Language } from 'src/app/services/api/entities/config.entity';
import { TranscriptionEntity } from 'src/app/services/api/entities/transcription.entity';
import { AppState } from 'src/app/store/app.state';
import * as configSelectors from '../../../../../../../../../store/selectors/config.selector';

@Component({
  selector: 'app-from-media-transcription',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    WrittenOutLanguagePipe,
    PushPipe,
    MatIconModule,
    MatButtonModule,
    UploadFilesComponent,
    MatProgressBarModule,
  ],
  templateUrl: './from-media-transcription.component.html',
  styleUrl: './from-media-transcription.component.scss',
})
export class FromMediaTranscriptionComponent {
  public asrServices$ = this.store.select(configSelectors.asrServiceConfig);
  public asrLanguages$: Observable<Language[] | undefined>;

  @Output() loadingEvent = new EventEmitter<boolean>();

  loading = false;
  uploadProgress: number = 0;

  acceptedFileFormats = ['audio/*', 'video/*', 'audio', 'video'];

  destroyRef = inject(DestroyRef);
  writtenOutLanguagePipe = inject(WrittenOutLanguagePipe);

  api = inject(ApiService);

  constructor(private store: Store<AppState>) {
    this.asrLanguages$ = this.transcriptionGroup.controls[
      'asrVendor'
    ].valueChanges.pipe(
      switchMap((selectedAsrVendor) =>
        this.asrServices$.pipe(
          map((asrServices) =>
            asrServices.find(
              (asrService) => asrService.asrVendor === selectedAsrVendor
            )
          ),
          map((asrService) => asrService?.languages)
        )
      )
    );
  }

  transcriptionGroup = new FormGroup({
    title: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    asrVendor: new FormControl<AsrVendors | ''>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    language: new FormControl<string>(
      { value: '', disabled: true },
      {
        nonNullable: true,
        validators: [Validators.required],
      }
    ),
    file: new FormControl<File[]>([], {
      validators: [Validators.required, Validators.maxLength(1)],
    }),
  });

  onSelectLanguage(selectedLanguageCode: string) {
    if (this.transcriptionGroup.controls['title'].value !== '') return;

    const selectedLanguageName =
      this.writtenOutLanguagePipe.transform(selectedLanguageCode);

    this.transcriptionGroup.controls['title'].setValue(selectedLanguageName);
  }

  onClearTitle() {
    this.transcriptionGroup.controls['title'].setValue('');
  }

  async submit(projectId: string) {
    if (!this.transcriptionGroup.valid) {
      this.transcriptionGroup.markAllAsTouched();
      return;
    }

    const { title, language, file, asrVendor } =
      this.transcriptionGroup.getRawValue();

    if (asrVendor) {
      const newTranscription: CreateTranscriptionDto = {
        project: projectId,
        title,
        language,
        asrDto: {
          vendor: asrVendor,
        },
      };

      this.loading = true;
      this.loadingEvent.emit(true);

      const res = await new Promise((resolve, reject) => {
        this.api
          .createTranscriptionFromFile(newTranscription, file![0])
          .subscribe({
            next: (event: HttpEvent<TranscriptionEntity>) => {
              if (event.type === HttpEventType.UploadProgress) {
                this.uploadProgress =
                  (event.loaded / (event.total ? event.total : file![0].size)) *
                  100;
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
      this.loadingEvent.emit(false);
    }
  }
}
