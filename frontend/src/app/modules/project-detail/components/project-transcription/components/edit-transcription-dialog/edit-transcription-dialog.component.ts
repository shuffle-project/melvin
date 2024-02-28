import { Component, Inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { LANGUAGES } from 'src/app/constants/languages.constant';
import { ProjectDetailComponent } from 'src/app/modules/project-detail/project-detail.component';
import { ProjectEntity } from 'src/app/services/api/entities/project.entity';
import { TranscriptionEntity } from 'src/app/services/api/entities/transcription.entity';
import { AppState } from 'src/app/store/app.state';
import * as transcriptionsActions from '../../../../../../store/actions/transcriptions.actions';
import * as editorSelectors from '../../../../../../store/selectors/editor.selector';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-edit-transcription-dialog',
  templateUrl: './edit-transcription-dialog.component.html',
  styleUrls: ['./edit-transcription-dialog.component.scss'],
  standalone: true,
  imports: [
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
})
export class EditTranscriptionDialogComponent implements OnInit {
  languages = LANGUAGES;
  transcriptionId: string;
  project!: ProjectEntity;

  transcriptionEditGroup = new FormGroup({
    title: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    language: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) transcription: TranscriptionEntity,
    private store: Store<AppState>,
    private dialogRef: MatDialogRef<EditTranscriptionDialogComponent>,
    private dialog: MatDialog
  ) {
    this.transcriptionEditGroup.controls['title'].setValue(transcription.title);
    this.transcriptionEditGroup.controls['language'].setValue(
      transcription.language
    );
    this.transcriptionId = transcription.id;
  }

  async ngOnInit() {
    this.project = (await firstValueFrom(
      this.store.select(editorSelectors.selectProject)
    )) as ProjectEntity;
  }

  onEditTranscription() {
    const title = this.transcriptionEditGroup.controls['title'].value;
    const language = this.transcriptionEditGroup.controls['language'].value;

    this.store.dispatch(
      transcriptionsActions.updateFromEditor({
        transcription: { title, language },
        transcriptionId: this.transcriptionId,
      })
    );

    this.dialogRef.close();
    this.dialog.open(ProjectDetailComponent, {
      data: { projectId: this.project.id, tab: 'transcription' },
      width: '70%',
      height: '70vh',
    });
  }
}
