import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UploadFilesComponent } from 'src/app/components/upload-files/upload-files.component';
import { LANGUAGES } from 'src/app/constants/languages.constant';

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
  ],
  templateUrl: './upload-transcription.component.html',
  styleUrl: './upload-transcription.component.scss',
})
export class UploadTranscriptionComponent {
  languages = LANGUAGES;
  acceptedFileFormats = ['.vtt', '.srt'];

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
}
