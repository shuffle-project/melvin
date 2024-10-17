import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LetDirective } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { HeaderComponent } from '../../../components/header/header.component';
import { DurationPipe } from '../../../pipes/duration-pipe/duration.pipe';
import { AppState } from '../../../store/app.state';
import * as configSelector from '../../../store/selectors/config.selector';
import { MediaSourceComponent } from './components/media-source/media-source.component';
import { AddAudioSourceComponent } from './dialogs/add-audio-source/add-audio-source.component';
import { AddScreensharingSourceComponent } from './dialogs/add-screensharing-source/add-screensharing-source.component';
import { AddVideoSourceComponent } from './dialogs/add-video-source/add-video-source.component';
import { RecorderService } from './recorder.service';

@Component({
  selector: 'app-recorder',
  templateUrl: './recorder.component.html',
  styleUrls: ['./recorder.component.scss'],
  standalone: true,
  imports: [
    MediaSourceComponent,
    DatePipe,
    HeaderComponent,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    LetDirective,
    DurationPipe,
    MatSlideToggleModule,
  ],
})
export class RecorderComponent implements OnInit, OnDestroy {
  public languages$ = this.store.select(configSelector.languagesConfig);

  locale = $localize.locale;
  recordingTitle: string = '';

  loading = true;

  constructor(
    public dialog: MatDialog,
    public recorderService: RecorderService,
    private store: Store<AppState>
  ) {
    if (this.locale?.startsWith('en')) {
      this.recordingTitle = 'Recording from ' + new Date().toLocaleDateString();
    } else {
      this.recordingTitle = 'Aufnahme vom ' + new Date().toLocaleDateString();
    }
  }

  async ngOnInit() {
    this.loading = false;
  }

  ngOnDestroy(): void {
    this.recorderService.resetData();
  }

  onAddAudioSource() {
    this.dialog.open(AddAudioSourceComponent, {
      data: {},
    });
  }

  onAddVideoSource() {
    this.dialog.open(AddVideoSourceComponent, {
      data: {},
    });
  }

  onAddScreenSharingSource() {
    this.dialog.open(AddScreensharingSourceComponent, {
      data: {},
    });
  }

  getCurrentDuration() {
    if (
      this.recorderService.recordingPaused ||
      !this.recorderService.recording
    ) {
      return this.recorderService.previousDuration;
    } else {
      return (
        this.recorderService.previousDuration +
        (Date.now() - this.recorderService.recordingTimestamp)
      );
    }
  }

  onClickStartRecord() {
    this.recorderService.startRecording();
  }

  async onClickStopRecord() {
    this.recorderService.stopRecording(this.recordingTitle);
  }

  onClickTogglePauseRecording() {
    if (this.recorderService.recordingPaused) {
      this.recorderService.onResumeMediaRecorder();
    } else {
      this.recorderService.onPauseMediaRecorder();
    }
  }

  recordingDisabled() {
    const noAudioAvailable =
      this.recorderService.audios.length === 0 &&
      this.recorderService.screensharings.filter((value) => value.sound)
        .length === 0;
    const noVideoAvailable =
      this.recorderService.videos.length === 0 &&
      this.recorderService.screensharings.length === 0;

    return (
      this.recorderService.recording || noAudioAvailable || noVideoAvailable
    );
  }
}
