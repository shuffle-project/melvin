import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { Observable, map, switchMap } from 'rxjs';
import { UploadFilesComponent } from 'src/app/components/upload-files/upload-files.component';
import { WrittenOutLanguagePipe } from 'src/app/pipes/written-out-language-pipe/written-out-language.pipe';
import { AsrVendors } from 'src/app/services/api/dto/create-transcription.dto';
import { Language } from 'src/app/services/api/entities/config.entity';
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
  ],
  templateUrl: './from-media-transcription.component.html',
  styleUrl: './from-media-transcription.component.scss',
})
export class FromMediaTranscriptionComponent {
  public asrServices$ = this.store.select(configSelectors.asrServiceConfig);
  public asrLanguages$: Observable<Language[] | undefined>;

  acceptedFileFormats = ['audio/*', 'video/*', 'audio', 'video'];

  destroyRef = inject(DestroyRef);
  writtenOutLanguagePipe = inject(WrittenOutLanguagePipe);

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
}
