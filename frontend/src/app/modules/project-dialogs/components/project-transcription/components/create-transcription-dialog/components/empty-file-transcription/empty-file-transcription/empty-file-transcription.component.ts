import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
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
import { Store } from '@ngrx/store';
import { WrittenOutLanguagePipe } from 'src/app/pipes/written-out-language-pipe/written-out-language.pipe';
import { CreateTranscriptionDto } from 'src/app/services/api/dto/create-transcription.dto';
import { LanguageService } from 'src/app/services/language/language.service';
import { AppState } from 'src/app/store/app.state';
import * as transcriptionsActions from '../../../../../../../../../store/actions/transcriptions.actions';
import { CreateTranscriptionDialogComponent } from '../../../create-transcription-dialog.component';

@Component({
  selector: 'app-empty-file-transcription',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    WrittenOutLanguagePipe,
    ReactiveFormsModule,
  ],
  templateUrl: './empty-file-transcription.component.html',
  styleUrl: './empty-file-transcription.component.scss',
})
export class EmptyFileTranscriptionComponent {
  store = inject(Store<AppState>);
  dialogRef = inject(MatDialogRef<CreateTranscriptionDialogComponent>);
  languageService = inject(LanguageService);

  languages = this.languageService.getLocalizedLanguages();

  transcriptionGroup = new FormGroup({
    title: new FormControl<string>('', {
      nonNullable: true,
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

    const { title, language } = this.transcriptionGroup.getRawValue();

    const newTranscription: CreateTranscriptionDto = {
      project: projectId,
      title,
      language,
    };

    this.store.dispatch(transcriptionsActions.create({ newTranscription }));
    this.dialogRef.close();
  }
}
