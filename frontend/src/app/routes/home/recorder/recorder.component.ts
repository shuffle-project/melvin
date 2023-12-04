import { DatePipe, NgFor, NgIf } from '@angular/common';
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
import { SourceObject } from './recorder.interfaces';
import { RecorderService } from './recorder.service';

@Component({
  selector: 'app-recorder',
  templateUrl: './recorder.component.html',
  styleUrls: ['./recorder.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
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
    // this.recorderService.onStartScreenSharingSource(MediaCategory.SLIDES);
  }

  onClickStartRecord() {
    if (this.recording) return;

    const allTracks: MediaStreamTrack[] = [];

    // this.recorderService.videos.forEach((element) => {
    //   allTracks.push(...element.mediaStream.getTracks());
    // });
    // this.recorderService.audios.forEach((element) => {
    //   allTracks.push(...element.mediaStream.getTracks());
    // });

    const combined = new MediaStream([...allTracks]);

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

  onRemoveMediaSourceElement(obj: SourceObject, index: number) {
    // TODO
    // switch (obj.type) {
    //   case 'audioinput':
    //     this.recorderService.audios.splice(index, 1);
    //     break;
    //   case 'videoinput':
    //     this.recorderService.videos.splice(index, 1);
    //     break;
    //   case 'screensharinginput':
    //     this.recorderService.screens.splice(index, 1);
    //     break;
    // }
  }
}
