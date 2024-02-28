import { Component, Input } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { CreateTranscriptionDialogComponent } from 'src/app/modules/project-detail/components/project-transcription/components/create-transcription-dialog/create-transcription-dialog.component';
import { TranscriptionEntity } from 'src/app/services/api/entities/transcription.entity';
import { AppState } from 'src/app/store/app.state';
import * as transcriptionsSelectors from '../../../../store/selectors/transcriptions.selector';
import { ProjectDetailComponent } from '../../project-detail.component';
import { TranscriptionComponent } from './components/transcription/transcription.component';

import { MatIconModule } from '@angular/material/icon';
import { LetDirective, PushPipe } from '@ngrx/component';

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
    private dialogRefProjectDetail: MatDialogRef<ProjectDetailComponent>,
    private dialog: MatDialog
  ) {
    this.transcriptionsList$ = this.store.select(
      transcriptionsSelectors.selectTranscriptionList
    );
  }

  onClickAddTranscription() {
    this.dialogRefProjectDetail.close();
    this.dialog.open(CreateTranscriptionDialogComponent, {
      width: '100%',
      maxWidth: '800px',
      maxHeight: '90vh',
    });
  }
}
