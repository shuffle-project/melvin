import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { LetDirective, PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { CreateTranscriptionDialogComponent } from 'src/app/modules/project-dialogs/components/project-transcription/components/create-transcription-dialog/create-transcription-dialog.component';
import { DialogProjectTranscriptionComponent } from 'src/app/modules/project-dialogs/dialog-project-transcription/dialog-project-transcription.component';
import { FeatureEnabledPipe } from 'src/app/pipes/feature-enabled-pipe/feature-enabled.pipe';
import { ProjectStatusPipe } from 'src/app/pipes/project-status-pipe/project-status.pipe';
import { WrittenOutLanguagePipe } from 'src/app/pipes/written-out-language-pipe/written-out-language.pipe';
import { TranscriptionStatus } from 'src/app/services/api/entities/transcription.entity';
import { AppState } from 'src/app/store/app.state';
import * as transcriptionsActions from '../../../../../../app/store/actions/transcriptions.actions';
import * as transcriptionsSelectors from '../../../../../../app/store/selectors/transcriptions.selector';

@Component({
  selector: 'app-transcription-menu-content',
  imports: [
    FeatureEnabledPipe,
    MatDividerModule,
    MatMenuModule,
    MatIconModule,
    WrittenOutLanguagePipe,
    LetDirective,
    PushPipe,
    ProjectStatusPipe,
  ],
  templateUrl: './transcription-menu-content.component.html',
  styleUrl: './transcription-menu-content.component.scss',
})
export class TranscriptionMenuContentComponent {
  @Input() projectId!: string;

  public selectedTranscriptionId$ = this.store.select(
    transcriptionsSelectors.selectTranscriptionId
  );

  public transcriptionsList$ = this.store.select(
    transcriptionsSelectors.selectTranscriptionList
  );

  tStatus = TranscriptionStatus;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private store: Store<AppState>
  ) {}

  onSelectTranscription(transcriptionId: string) {
    this.router.navigate([], { queryParams: { transcriptionId } });
    this.store.dispatch(
      transcriptionsActions.selectFromEditor({ transcriptionId })
    );
  }

  onClickTranscriptionEdit() {
    this.dialog.open(DialogProjectTranscriptionComponent, {
      data: { projectId: this.projectId },
      width: '100%',
      maxWidth: '50rem',
      maxHeight: '90vh',
    });
  }

  onClickTranscriptionAdd() {
    this.dialog.open(CreateTranscriptionDialogComponent, {
      data: { projectId: this.projectId },
      width: '100%',
      maxWidth: '50rem',
      maxHeight: '90vh',
    });
  }
}
