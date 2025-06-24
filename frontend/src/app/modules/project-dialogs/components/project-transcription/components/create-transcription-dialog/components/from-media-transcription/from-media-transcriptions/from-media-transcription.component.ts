import { CommonModule } from '@angular/common';
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
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Store } from '@ngrx/store';
import { lastValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api/api.service';
import {
  AsrVendors,
  CreateTranscriptionDto,
} from 'src/app/services/api/dto/create-transcription.dto';
import { UploadService } from 'src/app/services/upload/upload.service';
import { AppState } from 'src/app/store/app.state';
import * as configSelectors from '../../../../../../../../../store/selectors/config.selector';
import { CreateTranscriptionDialogComponent } from '../../../create-transcription-dialog.component';

@Component({
  selector: 'app-from-media-transcription',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
  ],
  templateUrl: './from-media-transcription.component.html',
  styleUrl: './from-media-transcription.component.scss',
})
export class FromMediaTranscriptionComponent {
  private asrLanguages$ = this.store.select(
    configSelectors.getSupportedASRLanguages
  );
  asrLanguages: { code: string; name: string }[] = [];

  locale = $localize.locale;

  @Output() loadingEvent = new EventEmitter<boolean>();

  loading = false;
  uploadProgress: number = 0;

  acceptedFileFormats = ['audio/*', 'video/*', 'audio', 'video'];

  dialogRef = inject(MatDialogRef<CreateTranscriptionDialogComponent>);
  destroyRef = inject(DestroyRef);
  api = inject(ApiService);

  constructor(
    private store: Store<AppState>,
    private uploadService: UploadService
  ) {
    this.asrLanguages$.subscribe((languages) => {
      this.asrLanguages = languages.map((l) => {
        if (this.locale?.startsWith('en')) {
          return { code: l.code, name: l.englishName };
        } else {
          return { code: l.code, name: l.germanName };
        }
      });
    });
  }

  transcriptionGroup = new FormGroup({
    title: new FormControl<string>('', {
      nonNullable: true,
    }),
    language: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    file: new FormControl<File[]>([], {
      validators: [Validators.required, Validators.maxLength(1)],
    }),
  });

  onClearTitle() {
    this.transcriptionGroup.controls['title'].setValue('');
  }

  async submit(projectId: string) {
    if (!this.transcriptionGroup.valid) {
      this.transcriptionGroup.markAllAsTouched();
      return;
    }

    const { title, language, file } = this.transcriptionGroup.getRawValue();

    const newTranscription: CreateTranscriptionDto = {
      project: projectId,
      title,
      language,
      asrDto: {
        vendor: AsrVendors.WHISPER,
      },
    };

    this.loading = true;
    this.loadingEvent.emit(true);

    const uploadHandler = this.uploadService.createUpload(file![0]);
    await uploadHandler.start();

    // TODO
    const createdTranscription = await lastValueFrom(
      this.api.createTranscription({
        ...newTranscription,
        uploadId: uploadHandler.progress$.value.uploadId!,
      })
    );

    this.dialogRef.close();

    this.loading = false;
    this.loadingEvent.emit(false);
  }
}
