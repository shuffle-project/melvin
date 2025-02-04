import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Store } from '@ngrx/store';
import {
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  Room,
  RoomEvent,
} from 'livekit-client';
import { HeaderComponent } from '../../../components/header/header.component';
import { DurationPipe } from '../../../pipes/duration-pipe/duration.pipe';
import { AppState } from '../../../store/app.state';
import * as configSelector from '../../../store/selectors/config.selector';
import { MediaSourceComponent } from './components/media-source/media-source.component';
import { RecorderService } from './recorder.service';

import { firstValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api/api.service';

@Component({
  selector: 'app-recorder',
  templateUrl: './recorder.component.html',
  styleUrls: ['./recorder.component.scss'],
  imports: [
    MediaSourceComponent,
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
    DurationPipe,
    MatSlideToggleModule,
  ],
})
export class RecorderComponent implements OnInit, OnDestroy {
  @ViewChild('lalelu') lalelu!: ElementRef<HTMLDivElement>;

  public languages$ = this.store.select(configSelector.languagesConfig);

  locale = $localize.locale;
  recordingTitle: string = '';

  loading = true;

  constructor(
    public dialog: MatDialog,
    public recorderService: RecorderService,
    private store: Store<AppState>,
    private api: ApiService
  ) {
    if (this.locale?.startsWith('en')) {
      this.recordingTitle = 'Recording from ' + new Date().toLocaleDateString();
    } else {
      this.recordingTitle = 'Aufnahme vom ' + new Date().toLocaleDateString();
    }
  }

  room!: Room;

  async ngOnInit() {
    this.loading = false;

    const res = await firstValueFrom(this.api.getLivekitToken());
    console.log(res);

    this.room = new Room();
    await this.room.connect(res.url, res.authToken);
    console.log('connected to room', this.room.name);
    // this.room.emit('chatMessage', 'hello from angular');
    this.room.on(
      RoomEvent.TrackSubscribed,
      (
        track: RemoteTrack,
        publication: RemoteTrackPublication,
        participant: RemoteParticipant
      ) => {
        console.log('Track subscribed event', track, publication, participant);
        const element = track.attach();
        this.lalelu.nativeElement.appendChild(element);
      }
    );

    // Also subscribe to tracks published before participant joined
    this.room.remoteParticipants.forEach((participant) => {
      participant.trackPublications.forEach((publication) => {
        publication.setSubscribed(true);
      });
    });

    await this.room.localParticipant.enableCameraAndMicrophone();
  }

  ngOnDestroy(): void {
    this.recorderService.resetData();
    this.room.disconnect(true);
  }

  onAddAudioSource() {
    // let roomxx = await this.room.connect(url, token, {
    //   autoSubscribe: false,
    // });
    // this.room.on(RoomEvent.TrackPublished, (publication, participant) => {
    //   publication.setSubscribed(true);
    // });
    // // Also subscribe to tracks published before participant joined
    // this.room.remoteParticipants.forEach((participant) => {
    //   participant.trackPublications.forEach((publication) => {
    //     publication.setSubscribed(true);
    //   });
    // });
    // this.dialog.open(AddAudioSourceComponent, {
    //   data: {},
    // });
  }

  async onAddVideoSource() {
    // const videoTrack = await createLocalVideoTrack({
    //   facingMode: 'user',
    //   // preset resolutions
    //   resolution: VideoPresets.h720,
    // });
    // const audioTrack = await createLocalAudioTrack({
    //   echoCancellation: true,
    //   noiseSuppression: true,
    // });
    // const videoPublication = await this.room.localParticipant.publishTrack(
    //   videoTrack
    // );
    // const audioPublication = await this.room.localParticipant.publishTrack(
    //   audioTrack
    // );
    // this.dialog.open(AddVideoSourceComponent, {
    //   data: {},
    // });
  }

  onAddScreenSharingSource() {
    // this.dialog.open(AddScreensharingSourceComponent, {
    //   data: {},
    // });
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
