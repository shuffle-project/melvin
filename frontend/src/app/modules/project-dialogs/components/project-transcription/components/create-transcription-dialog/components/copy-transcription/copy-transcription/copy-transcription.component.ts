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
import { Store } from '@ngrx/store';
import { LANGUAGES } from 'src/app/constants/languages.constant';
import { WrittenOutLanguagePipe } from 'src/app/pipes/written-out-language-pipe/written-out-language.pipe';
import { CreateTranscriptionDto } from 'src/app/services/api/dto/create-transcription.dto';
import { TranscriptionEntity } from 'src/app/services/api/entities/transcription.entity';
import { AppState } from 'src/app/store/app.state';
import * as transcriptionsActions from '../../../../../../../../../store/actions/transcriptions.actions';
import { CreateTranscriptionDialogComponent } from '../../../create-transcription-dialog.component';

@Component({
  selector: 'app-copy-transcription',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    WrittenOutLanguagePipe,
  ],
  templateUrl: './copy-transcription.component.html',
  styleUrl: './copy-transcription.component.scss',
})
export class CopyTranscriptionComponent {
  @Input() transcriptionList: TranscriptionEntity[] = [];

  dialogRef = inject(MatDialogRef<CreateTranscriptionDialogComponent>);
  constructor(private store: Store<AppState>) {}

  languages = LANGUAGES;

  transcriptionGroup = new FormGroup({
    title: new FormControl<string>('', {
      nonNullable: true,
    }),
    transcription: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  onSelectTranscription(selectedTranscriptionId: string) {
    const titleControl = this.transcriptionGroup.controls['title'];

    if (!titleControl.value) {
      const selectedTranscription = this.transcriptionList.find(
        (ts) => ts.id === selectedTranscriptionId
      );

      let localizedCopy = $localize`:@@copyTranscriptionTabCopy:copy`;
      titleControl.setValue(`${selectedTranscription?.title} ${localizedCopy}`);
    }
  }

  onClearTitle() {
    this.transcriptionGroup.controls['title'].setValue('');
  }

  submit(projectId: string) {
    if (!this.transcriptionGroup.valid) {
      this.transcriptionGroup.markAllAsTouched();
      return;
    }

    const { title, transcription } = this.transcriptionGroup.getRawValue();

    const language = this.transcriptionList.find(
      (ts) => ts.id === transcription
    )?.language!;

    const newTranscription: CreateTranscriptionDto = {
      project: projectId,
      title,
      language,
      copyDto: {
        sourceTranscriptionId: transcription,
      },
    };

    this.store.dispatch(transcriptionsActions.create({ newTranscription }));
    this.dialogRef.close();
  }
}
