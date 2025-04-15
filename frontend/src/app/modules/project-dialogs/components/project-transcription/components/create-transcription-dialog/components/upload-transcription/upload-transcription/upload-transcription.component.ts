import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { lastValueFrom } from 'rxjs';
import { UploadFilesComponent } from 'src/app/components/upload-files/upload-files.component';
import { UploadProgressComponent } from 'src/app/components/upload-progress/upload-progress.component';
import { WrittenOutLanguagePipe } from 'src/app/pipes/written-out-language-pipe/written-out-language.pipe';
import { ApiService } from 'src/app/services/api/api.service';
import { CreateTranscriptionDto } from 'src/app/services/api/dto/create-transcription.dto';
import { LanguageService } from 'src/app/services/language/language.service';
import { UploadHandler } from 'src/app/services/upload/upload-handler';
import { UploadService } from 'src/app/services/upload/upload.service';
import { CreateTranscriptionDialogComponent } from '../../../create-transcription-dialog.component';

@Component({
  selector: 'app-upload-transcription',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    UploadFilesComponent,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    WrittenOutLanguagePipe,
    MatProgressBarModule,
    UploadProgressComponent,
  ],
  templateUrl: './upload-transcription.component.html',
  styleUrl: './upload-transcription.component.scss',
})
export class UploadTranscriptionComponent {
  @Output() loadingEvent = new EventEmitter<boolean>();

  loading = false;
  // uploadProgress: number = 0
  public uploadHandler: UploadHandler | undefined = undefined;
  filename: string = '';

  constructor(
    private languageService: LanguageService,
    private uploadService: UploadService
  ) {}

  languages = this.languageService.getLocalizedLanguages();
  acceptedFileFormats = ['.vtt', '.srt'];

  dialogRef = inject(MatDialogRef<CreateTranscriptionDialogComponent>);
  api = inject(ApiService);

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
    };

    this.loading = true;
    this.loadingEvent.emit(true);
    this.filename = file![0].name;
    const uploadHandler = this.uploadService.createUpload(file![0]);
    this.uploadHandler = uploadHandler;
    await uploadHandler.start();

    const createdTranscription = await lastValueFrom(
      this.api.createTranscription({
        ...newTranscription,
        uploadId: uploadHandler.progress$.value.uploadId!,
      })
    );

    // TODO
    this.dialogRef.close();

    this.loading = false;
    this.loadingEvent.emit(false);
  }
}
