import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
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
import { LocalTrack } from 'livekit-client';
import { HeaderComponent } from '../../../components/header/header.component';
import { DurationPipe } from '../../../pipes/duration-pipe/duration.pipe';
import { AppState } from '../../../store/app.state';
import * as configSelector from '../../../store/selectors/config.selector';
import { MediaSourceComponent } from './components/media-source/media-source.component';

import { LiveKitService } from './liveKit.service';

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
  @ViewChild('testWrapper') testWrapper!: ElementRef<HTMLDivElement>;

  public languages$ = this.store.select(configSelector.languagesConfig);

  locale = $localize.locale;
  recordingTitle: string = '';

  loading = true;

  screensharingTracks: LocalTrack[] = [];
  @ViewChildren('screenSharingVideoElement')
  screenSharingVideoElements!: QueryList<ElementRef<HTMLVideoElement>>;

  constructor(
    public dialog: MatDialog,
    // public recorderService: RecorderService,
    private store: Store<AppState>,
    public livekitService: LiveKitService
  ) {
    if (this.locale?.startsWith('en')) {
      this.recordingTitle = 'Recording from ' + new Date().toLocaleDateString();
    } else {
      this.recordingTitle = 'Aufnahme vom ' + new Date().toLocaleDateString();
    }
  }

  // ngAfterViewInit() {
  //   this.screenSharingVideoElements.changes.subscribe((elements) => {
  //     this.screenSharingVideoElements.forEach((element, i) => {
  //       if ([...this.livekitService.videoSourceMap][i]) {
  //         [...this.livekitService.videoSourceMap][i][1].track.attach(
  //           element.nativeElement
  //         );
  //       }
  //       if (this.screensharingTracks[i]) {
  //         this.screensharingTracks[i].attach(element.nativeElement);
  //       }
  //     });
  //   });
  // }

  onRemoveTrack(track: LocalTrack) {
    // this.livekitService.removeTrack(track);
  }

  async ngOnInit() {
    this.loading = false;
    this.livekitService.init('projectId');

    // this.room.emit('chatMessage', 'hello from angular');
    // this.room.on(
    //   RoomEvent.TrackSubscribed,
    //   (
    //     track: RemoteTrack,
    //     publication: RemoteTrackPublication,
    //     participant: RemoteParticipant
    //   ) => {
    // console.log('Track subscribed event', track, publication, participant);
    // const element = track.attach();
    // this.lalelu.nativeElement.appendChild(element);
    //   }
    // );

    // Also subscribe to tracks published before participant joined
    // this.room.remoteParticipants.forEach((participant) => {
    //   participant.trackPublications.forEach((publication) => {
    //     publication.setSubscribed(true);
    //   });
    // });

    // await this.room.localParticipant.enableCameraAndMicrophone();
  }

  ngOnDestroy(): void {
    // this.recorderService.resetData();
    this.livekitService.destroy();
  }

  async onAddAudioSource() {
    this.livekitService.addAudioTrack();
  }

  async onAddVideoSource() {
    await this.livekitService.addVideoTrack();
  }

  async onAddScreenSharingSource() {
    await this.livekitService.addScreenTrack();
  }

  getCurrentDuration() {
    // if (
    //   this.recorderService.recordingPaused ||
    //   !this.recorderService.recording
    // ) {
    //   return this.recorderService.previousDuration;
    // } else {
    //   return (
    //     this.recorderService.previousDuration +
    //     (Date.now() - this.recorderService.recordingTimestamp)
    //   );
    // }
  }

  onClickStartRecord() {
    // this.recorderService.startRecording();
  }

  async onClickStopRecord() {
    // this.recorderService.stopRecording(this.recordingTitle);
  }

  onClickTogglePauseRecording() {
    // if (this.recorderService.recordingPaused) {
    //   this.recorderService.onResumeMediaRecorder();
    // } else {
    //   this.recorderService.onPauseMediaRecorder();
    // }
  }
}
