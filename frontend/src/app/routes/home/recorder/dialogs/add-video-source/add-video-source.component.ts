import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { v4 } from 'uuid';
import { MediaCategory } from '../../../../../services/api/entities/project.entity';
import { VideoSource } from '../../recorder.interfaces';
import { RecorderService } from '../../recorder.service';

@Component({
  selector: 'app-add-video-source',
  templateUrl: './add-video-source.component.html',
  styleUrls: ['./add-video-source.component.scss'],
})
export class AddVideoSourceComponent implements OnInit, OnDestroy {
  MediaCategory = MediaCategory;
  loading = true;
  loadingError: any | null = null;
  deviceError: any | null = null;

  videoinputs: MediaDeviceInfo[] = [];
  currentInput!: MediaDeviceInfo;
  videoSource: VideoSource = {
    id: v4(),
    title: 'default video',
    deviceId: '',
    label: '',
    mediaCategory: MediaCategory.OTHER,
    mediaStream: null,
  };

  constructor(
    public dialogRef: MatDialogRef<AddVideoSourceComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {},
    private recorderService: RecorderService
  ) {}

  async ngOnInit() {
    const enumerateDevices = await navigator.mediaDevices.enumerateDevices();
    this.videoinputs = enumerateDevices.filter(
      (device) => device.kind === 'videoinput'
    );

    if (this.videoinputs.length > 0) {
      this.currentInput = this.videoinputs[0];
      await this.resetVideoSource(this.videoinputs[0]);
    } else {
      // TODO permissions ? keine geräte ? show error
      this.loadingError =
        'Es konnten keine Videogeräte gefunden werden<. Entweder sind keine Berechtigungen gesetzt oder ist kein Audiogerät angeschlossen!';
    }

    this.loading = false;
  }

  ngOnDestroy() {
    this.videoSource.mediaStream?.getTracks().forEach((track) => track.stop());
  }

  async resetVideoSource(mediaDeviceInfo: MediaDeviceInfo) {
    this.videoSource.deviceId = mediaDeviceInfo.deviceId;
    this.videoSource.label = mediaDeviceInfo.label;

    // remove old stream
    if (this.videoSource.mediaStream) {
      this.videoSource.mediaStream.getTracks().forEach((track) => track.stop());
      this.videoSource.mediaStream = null;
    }

    // create new stream
    try {
      this.videoSource.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { deviceId: mediaDeviceInfo.deviceId },
      });
    } catch (error) {
      this.deviceError = error; // TODO
    }
  }

  onSelectionChange() {
    this.resetVideoSource(this.currentInput);
  }

  onCloseDialog() {
    this.dialogRef.close();
  }

  onSubmitDialog() {
    this.recorderService.videos.push({ ...this.videoSource });
    this.videoSource.mediaStream = null;

    this.dialogRef.close();
  }
}
