import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MediaCategory } from '../../../services/api/entities/project.entity';
import { AddSourceDialogComponent } from './dialogs/add-source-dialog/add-source-dialog.component';
import { SourceObj } from './recorder.interfaces';
import { RecorderService } from './recorder.service';

@Component({
  selector: 'app-recorder',
  templateUrl: './recorder.component.html',
  styleUrls: ['./recorder.component.scss'],
})
export class RecorderComponent implements OnInit, OnDestroy {
  today = new Date();

  mode: 'setup' | 'record' = 'setup';

  loading = true;
  recording = false;
  mediaRecorder: MediaRecorder | null = null;
  chunks: Blob[] = [];

  constructor(
    public dialog: MatDialog,
    public recorderService: RecorderService
  ) {}

  async ngOnInit() {
    // const enumerateDevices = await navigator.mediaDevices.enumerateDevices();
    // this.audioInputs = enumerateDevices.filter(
    //   (device) => device.kind === 'audioinput'
    // );
    // this.videoInputs = enumerateDevices.filter(
    //   (device) => device.kind === 'videoinput'
    // );

    this.loading = false;
  }

  ngOnDestroy(): void {
    // TODO
    this.recorderService.resetData();
  }

  onAddAudioSource() {
    this.dialog.open(AddSourceDialogComponent, {
      data: { type: 'audioinput' },
    });
  }

  onAddVideoSource() {
    this.dialog.open(AddSourceDialogComponent, {
      data: { type: 'videoinput' },
    });
  }

  onAddScreenSharingSource() {
    this.recorderService.onStartScreenSharingSource(MediaCategory.SLIDES);
  }

  onClickStartRecord() {
    if (this.recording) return;

    const allTracks: MediaStreamTrack[] = [];

    this.recorderService.videos.forEach((element) => {
      allTracks.push(...element.mediaStream.getTracks());
    });
    this.recorderService.audios.forEach((element) => {
      allTracks.push(...element.mediaStream.getTracks());
    });

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

  onRemoveMediaSourceElement(obj: SourceObj, index: number) {
    switch (obj.type) {
      case 'audioinput':
        this.recorderService.audios.splice(index, 1);
        break;
      case 'videoinput':
        this.recorderService.videos.splice(index, 1);
        break;
      case 'screensharinginput':
        this.recorderService.screens.splice(index, 1);
        break;
    }
  }
}
