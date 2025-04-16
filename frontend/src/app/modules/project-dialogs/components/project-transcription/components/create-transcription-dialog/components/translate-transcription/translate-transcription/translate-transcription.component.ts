import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
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
import { MatSelectModule } from '@angular/material/select';
import { LetDirective, PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { Observable, map, switchMap } from 'rxjs';
import { WrittenOutLanguagePipe } from 'src/app/pipes/written-out-language-pipe/written-out-language.pipe';
import {
  CreateTranscriptionDto,
  TranslateVendors,
} from 'src/app/services/api/dto/create-transcription.dto';
import {
  LanguageShort,
  TranslationServiceConfig,
} from 'src/app/services/api/entities/config.entity';
import { TranscriptionEntity } from 'src/app/services/api/entities/transcription.entity';
import { AppState } from 'src/app/store/app.state';
import * as transcriptionsActions from '../../../../../../../../../store/actions/transcriptions.actions';
import * as configSelectors from '../../../../../../../../../store/selectors/config.selector';
import { CreateTranscriptionDialogComponent } from '../../../create-transcription-dialog.component';

@Component({
  selector: 'app-translate-transcription',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatInputModule,
    LetDirective,
    PushPipe,
    WrittenOutLanguagePipe,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './translate-transcription.component.html',
  styleUrl: './translate-transcription.component.scss',
})
export class TranslateTranscriptionComponent {
  @Input() transcriptionList: TranscriptionEntity[] = [];

  writtenOutLanguagePipe = inject(WrittenOutLanguagePipe);
  dialogRef = inject(MatDialogRef<CreateTranscriptionDialogComponent>);

  constructor(private store: Store<AppState>) {
    this.translationLanguages$ = this.transcriptionGroup.controls[
      'translationVendor'
    ].valueChanges.pipe(
      switchMap((selectedVendor) =>
        this.translationServices$.pipe(
          map((services: TranslationServiceConfig[]) =>
            services.find(
              (service) => service.translateVendor === selectedVendor
            )
          ),
          map((service) => service?.languages)
        )
      )
    );
  }

  // translationServices: TranslationServiceConfig[] = [
  //   {
  //     fullName: 'Test 1',
  //     translateVendor: TranslateVendors.DEEPL,
  //     languages: [{ code: 'de-DE', name: 'Deutsch' }],
  //   },
  //   {
  //     fullName: 'Test 2',
  //     translateVendor: TranslateVendors.GOOGLE,
  //     languages: [{ code: 'en-US', name: 'Englisch' }],
  //   },
  // ];
  // public translationServices$ = from([this.translationServices]);

  public translationServices$ = this.store.select(
    configSelectors.translationServiceConfig
  );
  public translationLanguages$: Observable<LanguageShort[] | undefined>;

  transcriptionGroup = new FormGroup({
    title: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    transcription: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    translationVendor: new FormControl<TranslateVendors | ''>('', {
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

  submit(projectId: string) {
    console.log('submit');
    if (!this.transcriptionGroup.valid) {
      this.transcriptionGroup.markAllAsTouched();
      return;
    }
    console.log('submit2');

    const { title, language, transcription, translationVendor } =
      this.transcriptionGroup.getRawValue();

    if (translationVendor) {
      const newTranscription: CreateTranscriptionDto = {
        project: projectId,
        title,
        language,
        translateDto: {
          sourceTranscriptionId: transcription,
          vendor: translationVendor,
          targetLanguage: language,
        },
      };

      this.store.dispatch(transcriptionsActions.create({ newTranscription }));
      this.dialogRef.close();
    }
  }
}
