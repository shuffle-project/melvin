import { Component, Input } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { TranscriptionEntity } from 'src/app/services/api/entities/transcription.entity';
import { AppState } from 'src/app/store/app.state';
import * as transcriptionsSelectors from '../../../../store/selectors/transcriptions.selector';
import { TranscriptionComponent } from './components/transcription/transcription.component';

import { MatIconModule } from '@angular/material/icon';
import { LetDirective, PushPipe } from '@ngrx/component';
import { DeleteConfirmationService } from '../../../../components/delete-confirmation-dialog/delete-confirmation.service';
import { DialogProjectTranscriptionComponent } from '../../dialog-project-transcription/dialog-project-transcription.component';
import { CreateTranscriptionDialogComponent } from './components/create-transcription-dialog/create-transcription-dialog.component';

@Component({
  selector: 'app-project-transcription',
  templateUrl: './project-transcription.component.html',
  styleUrls: ['./project-transcription.component.scss'],
  standalone: true,
  imports: [MatIconModule, LetDirective, TranscriptionComponent, PushPipe],
})
export class ProjectTranscriptionComponent {
  public transcriptionsList$: Observable<TranscriptionEntity[]>;
  @Input() projectId!: string;

  constructor(
    private store: Store<AppState>,
    private dialogRefProjectTranscription: MatDialogRef<DialogProjectTranscriptionComponent>,
    private dialog: MatDialog,
    private deleteService: DeleteConfirmationService
  ) {
    this.transcriptionsList$ = this.store.select(
      transcriptionsSelectors.selectTranscriptionList
    );
  }

  onClickAddTranscription() {
    this.dialogRefProjectTranscription.close();
    this.dialog.open(CreateTranscriptionDialogComponent, {
      width: '100%',
      maxWidth: '800px',
      maxHeight: '90vh',
    });
  }

  onEventDeleteTranscription(
    transcription: TranscriptionEntity,
    transcriptionsLength: number
  ) {
    if (transcriptionsLength < 2) {
      // TODO dont remove if there is just one transcription
      return;
    }

    this.deleteService.deleteTranscription(transcription);
  }
}
