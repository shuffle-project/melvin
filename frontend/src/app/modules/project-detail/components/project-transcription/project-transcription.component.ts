import { Component, Input } from '@angular/core';
import { MatLegacyDialog as MatDialog, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { CreateTranscriptionDialogComponent } from 'src/app/modules/project-detail/components/project-transcription/components/create-transcription-dialog/create-transcription-dialog.component';
import { TranscriptionEntity } from 'src/app/services/api/entities/transcription.entity';
import { AppState } from 'src/app/store/app.state';
import * as transcriptionsSelectors from '../../../../store/selectors/transcriptions.selector';
import { ProjectDetailComponent } from '../../project-detail.component';

@Component({
  selector: 'app-project-transcription',
  templateUrl: './project-transcription.component.html',
  styleUrls: ['./project-transcription.component.scss'],
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
      maxWidth: '700px',
      maxHeight: '90vh',
    });
  }
}
