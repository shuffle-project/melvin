import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MediaCategory } from '../../../../../services/api/entities/project.entity';
import { SourceObj } from '../../recorder.interfaces';
import { RecorderService } from '../../recorder.service';

@Component({
  selector: 'app-add-source-dialog',
  templateUrl: './add-source-dialog.component.html',
  styleUrls: ['./add-source-dialog.component.scss'],
})
export class AddSourceDialogComponent implements OnInit, OnDestroy {
  MediaCategory = MediaCategory;

  loading = true;
  streamLoading = true;

  sources!: MediaDeviceInfo[];
  currentSelection!: MediaDeviceInfo;

  mediaSource!: SourceObj;

  constructor(
    public dialogRef: MatDialogRef<AddSourceDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { type: 'audioinput' | 'videoinput' },
    private recorderService: RecorderService
  ) {}

  async ngOnInit() {
    const enumerateDevices = await navigator.mediaDevices.enumerateDevices();
    this.sources = enumerateDevices.filter(
      (device) => device.kind === this.data.type
    );
    this.currentSelection = this.sources[0];

    await this.fetchCurrentMediaStream();

    this.loading = false;
    this.streamLoading = false;
  }

  ngOnDestroy(): void {
    this.stopStream();
  }

  async onSelectionChange() {
    this.streamLoading = true;

    await this.fetchCurrentMediaStream();

    this.streamLoading = false;
  }

  async fetchCurrentMediaStream() {
    // close old
    this.stopStream();

    // create new
    const mediaStreamConstraints = {
      audio:
        this.data.type === 'audioinput'
          ? { deviceId: this.currentSelection?.deviceId }
          : false,
      video:
        this.data.type === 'videoinput'
          ? { deviceId: this.currentSelection?.deviceId }
          : false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(
      mediaStreamConstraints
    );

    switch (this.data.type) {
      case 'audioinput':
        this.mediaSource = {
          type: 'audioinput',
          title: 'this is a title',
          mediaStream: stream,
          mediaDeviceInfo: this.currentSelection,
        };
        break;

      case 'videoinput':
        this.mediaSource = {
          type: 'videoinput',
          title: 'this is a title',
          mediaStream: stream,
          mediaCategory: MediaCategory.OTHER,
          mediaDeviceInfo: this.currentSelection,
        };
        break;
    }
  }

  private stopStream() {
    if (this.mediaSource?.mediaStream) {
      this.mediaSource.mediaStream.getTracks().forEach((track) => track.stop());
    }
  }

  onAddMediaSource() {
    switch (this.data.type) {
      case 'audioinput':
        this.recorderService.onStartAudioSource(this.currentSelection);
        break;

      case 'videoinput':
        this.recorderService.onStartVideoSource(
          this.currentSelection,
          this.mediaSource.mediaCategory!
        );
        break;
    }
  }
}
