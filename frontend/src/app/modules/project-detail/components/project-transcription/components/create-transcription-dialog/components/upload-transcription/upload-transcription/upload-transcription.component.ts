import { CommonModule } from '@angular/common';
import { HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
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
import { UploadFilesComponent } from 'src/app/components/upload-files/upload-files.component';
import { LANGUAGES } from 'src/app/constants/languages.constant';
import { WrittenOutLanguagePipe } from 'src/app/pipes/written-out-language-pipe/written-out-language.pipe';
import { ApiService } from 'src/app/services/api/api.service';
import { CreateTranscriptionDto } from 'src/app/services/api/dto/create-transcription.dto';
import { TranscriptionEntity } from 'src/app/services/api/entities/transcription.entity';
import { CreateTranscriptionDialogComponent } from '../../../create-transcription-dialog.component';

@Component({
  selector: 'app-upload-transcription',
  standalone: true,
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
  ],
  templateUrl: './upload-transcription.component.html',
  styleUrl: './upload-transcription.component.scss',
})
export class UploadTranscriptionComponent {
  @Output() loadingEvent = new EventEmitter<boolean>();

  loading = false;
  uploadProgress: number = 0;

  languages = LANGUAGES;
  acceptedFileFormats = ['.vtt', '.srt'];

  writtenOutLanguagePipe = inject(WrittenOutLanguagePipe);
  dialogRef = inject(MatDialogRef<CreateTranscriptionDialogComponent>);
  api = inject(ApiService);

  transcriptionGroup = new FormGroup({
    title: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    language: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
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

    const { title, language, file } = this.transcriptionGroup.getRawValue();

    const newTranscription: CreateTranscriptionDto = {
      project: projectId,
      title,
      language,
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
              this.dialogRef.close();
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
