import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
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
  private destroy$$ = new Subject<void>();

  MediaCategory = MediaCategory;
  loading = true;
  loadingError: any | null = null;
  deviceError: any | null = null;

  videoinputs: MediaDeviceInfo[] = [];

  currentInput!: MediaDeviceInfo;
  videoSource: VideoSource = {
    type: 'video',
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
    public recorderService: RecorderService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  ngOnDestroy() {
    this.videoSource.mediaStream?.getTracks().forEach((track) => track.stop());
    this.videoSource.mediaStream = null;
    this.destroy$$.next();
  }

  async load(refresh = false) {
    this.loading = true;
    this.loadingError = null;
    this.deviceError = null;

    if (refresh) {
      this.recorderService.reloadDevices();
    }

    this.videoinputs = await this.recorderService.getDevices('videoinput');

    if (this.videoinputs.length > 0) {
      this.currentInput = this.videoinputs[0];
      await this.resetVideoSource(this.videoinputs[0]);
    } else {
      // TODO permissions ? keine geräte ? show error
      this.loadingError =
        'Es konnten keine Videogeräte gefunden werden. Entweder sind keine Berechtigungen gesetzt oder ist kein Videogerät angeschlossen!';
    }

    this.loading = false;
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

  onClickTryAgain() {
    this.load(true);
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
