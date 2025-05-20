import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, inject } from '@angular/core';
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
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { WrittenOutLanguagePipe } from 'src/app/pipes/written-out-language-pipe/written-out-language.pipe';
import {
  CreateTranscriptionDto,
  TranslateVendors,
} from 'src/app/services/api/dto/create-transcription.dto';
import { TranscriptionEntity } from 'src/app/services/api/entities/transcription.entity';
import { AppState } from 'src/app/store/app.state';
import * as transcriptionsActions from '../../../../../../../../..//store/actions/transcriptions.actions';
import { LanguageAutocompleteComponent } from '../../../../../../../../../components/language-autocomplete/language-autocomplete/language-autocomplete.component';
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
    PushPipe,
    WrittenOutLanguagePipe,
    MatButtonModule,
    MatIconModule,
    LanguageAutocompleteComponent,
  ],
  templateUrl: './translate-transcription.component.html',
  styleUrl: './translate-transcription.component.scss',
})
export class TranslateTranscriptionComponent implements OnDestroy {
  @Input() transcriptionList: TranscriptionEntity[] = [];

  writtenOutLanguagePipe = inject(WrittenOutLanguagePipe);
  dialogRef = inject(MatDialogRef<CreateTranscriptionDialogComponent>);

  public translationLanguages$ = this.store.select(
    configSelectors.getSupportedTranslationLanguages
  );

  private destroy$$ = new Subject<void>();

  constructor(private store: Store<AppState>) {}

  transcriptionGroup = new FormGroup({
    title: new FormControl<string>('', {
      nonNullable: true,
    }),
    transcription: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    language: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  onClearTitle() {
    this.transcriptionGroup.controls['title'].setValue('');
  }

  submit(projectId: string) {
    if (!this.transcriptionGroup.valid) {
      this.transcriptionGroup.markAllAsTouched();
      return;
    }

    const { title, language, transcription } =
      this.transcriptionGroup.getRawValue();

    const newTranscription: CreateTranscriptionDto = {
      project: projectId,
      title,
      language,
      translateDto: {
        sourceTranscriptionId: transcription,
        vendor: TranslateVendors.MELVIN,
        targetLanguage: language,
      },
    };

    this.store.dispatch(transcriptionsActions.create({ newTranscription }));
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.destroy$$.next();
  }
}
