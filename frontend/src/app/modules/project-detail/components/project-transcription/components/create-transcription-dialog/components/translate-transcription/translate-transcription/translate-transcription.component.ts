import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LetDirective, PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { Observable, from, map, switchMap } from 'rxjs';
import { TranslateVendors } from 'src/app/services/api/dto/create-transcription.dto';
import {
  Language,
  TranslationServiceConfig,
} from 'src/app/services/api/entities/config.entity';
import { TranscriptionEntity } from 'src/app/services/api/entities/transcription.entity';
import { AppState } from 'src/app/store/app.state';

@Component({
  selector: 'app-translate-transcription',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatInputModule,
    LetDirective,
    PushPipe,
  ],
  templateUrl: './translate-transcription.component.html',
  styleUrl: './translate-transcription.component.scss',
})
export class TranslateTranscriptionComponent {
  @Input() transcriptionList: TranscriptionEntity[] = [];

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

  translationServices: TranslationServiceConfig[] = [
    {
      fullName: 'Test 1',
      translateVendor: TranslateVendors.DEEPL,
      languages: [{ code: 'de-DE', name: 'Deutsch' }],
    },
    {
      fullName: 'Test 2',
      translateVendor: TranslateVendors.GOOGLE,
      languages: [{ code: 'en-US', name: 'Englisch' }],
    },
  ];
  public translationServices$ = from([this.translationServices]);

  // public translationServices$ = this.store.select(
  //   configSelectors.translationServiceConfig
  // );
  public translationLanguages$: Observable<Language[] | undefined>;

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
    language: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
}
