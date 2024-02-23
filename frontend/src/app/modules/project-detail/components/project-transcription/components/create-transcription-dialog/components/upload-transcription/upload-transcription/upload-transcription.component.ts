import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UploadFilesComponent } from 'src/app/components/upload-files/upload-files.component';
import { LANGUAGES } from 'src/app/constants/languages.constant';
import { WrittenOutLanguagePipe } from 'src/app/pipes/written-out-language-pipe/written-out-language.pipe';

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
  ],
  templateUrl: './upload-transcription.component.html',
  styleUrl: './upload-transcription.component.scss',
})
export class UploadTranscriptionComponent {
  languages = LANGUAGES;
  acceptedFileFormats = ['.vtt', '.srt'];
  writtenOutLanguagePipe = inject(WrittenOutLanguagePipe);

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
}
