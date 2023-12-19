import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HeaderComponent } from '../../../components/header/header.component';
import { MediaSourceComponent } from './components/media-source/media-source.component';
import { AddAudioSourceComponent } from './dialogs/add-audio-source/add-audio-source.component';
import { AddScreensharingSourceComponent } from './dialogs/add-screensharing-source/add-screensharing-source.component';
import { AddVideoSourceComponent } from './dialogs/add-video-source/add-video-source.component';
import { RecorderService } from './recorder.service';

interface Recording {
  title: string;
  mediaRecorder: MediaRecorder;
  tracks: MediaStreamTrack[];
  chunks: Blob[];
}

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
  ],
})
export class RecorderComponent implements OnInit, OnDestroy {
  today = new Date();

  loading = true;
  recording = false;
  mediaRecorder: MediaRecorder | null = null;
  chunks: Blob[] = [];

  recordings: Recording[] = [];

  constructor(
    public dialog: MatDialog,
    public recorderService: RecorderService
  ) {}

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

  onClickStartRecord() {
    if (this.recording) return;

    const mainTracks: MediaStreamTrack[] = [];

    // this.recorderService.audios.forEach((source) => {
    //   if (source.mediaStream)
    //     mainTracks.push(...source.mediaStream.getAudioTracks());
    // });

    // this.recorderService.videos.forEach((source) => {
    //   if (source.mediaStream)
    //     mainTracks.push(...source.mediaStream.getVideoTracks());
    // });

    // this.recorderService.screensharings.forEach((source) => {
    //   if (source.mediaStream)
    //     mainTracks.push(...source.mediaStream.getTracks());
    // });

    const audioStreamTracks = this.getMergedAudioTracks(
      this.recorderService.audios[0]!.mediaStream!,
      this.recorderService.screensharings[0]!.mediaStream!
    );

    const combined = new MediaStream([
      ...audioStreamTracks,
      ...this.recorderService.screensharings[0].mediaStream!.getVideoTracks(),
    ]);

    this.mediaRecorder = new MediaRecorder(combined);

    this.mediaRecorder.ondataavailable = (e) => this.chunks.push(e.data);
    this.mediaRecorder.onstop = (e) => this.onStopSaveRecording(e);

    this.mediaRecorder.start();
    this.recording = true;
  }

  onClickStopRecord() {
    if (!this.recording) return;

    this.mediaRecorder!.stop();

    // cleanup
    this.mediaRecorder = null;
    this.chunks = [];

    this.recording = false;
  }

  onStopSaveRecording(e: Event) {
    console.log(e);
    const capturedRecording = new Blob(this.chunks, { type: 'video/mp4' });

    var a = document.createElement('a');
    document.body.appendChild(a);
    const filename = 'recorder.mp4';
    const url = window.URL.createObjectURL(capturedRecording);
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  onClickReady() {
    this.recorderService.mode = 'record';
  }

  getMergedAudioTracks(
    stream1: MediaStream,
    stream2: MediaStream
  ): MediaStreamTrack[] {
    const audioCtx = new AudioContext();

    const source1 = audioCtx.createMediaStreamSource(stream1);
    const source2 = audioCtx.createMediaStreamSource(stream2);

    const destination = audioCtx.createMediaStreamDestination();

    source1.connect(destination);
    source2.connect(destination);

    return destination.stream.getAudioTracks();
  }
}
