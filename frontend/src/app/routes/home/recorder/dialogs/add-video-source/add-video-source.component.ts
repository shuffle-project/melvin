import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Subject } from 'rxjs';
import { v4 } from 'uuid';
import { MediaCategory } from '../../../../../services/api/entities/project.entity';
import { VideoSource } from '../../recorder.interfaces';
import { RecorderService } from '../../recorder.service';

@Component({
  selector: 'app-add-video-source',
  templateUrl: './add-video-source.component.html',
  styleUrls: ['./add-video-source.component.scss'],
  standalone: true,
  imports: [
    MatIconModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    FormsModule,
    MatInputModule,
  ],
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

  async load() {
    this.loading = true;
    this.loadingError = null;
    this.deviceError = null;

    try {
      const userMedia = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      this.videoSource.deviceId = userMedia.id;
      this.videoSource.label = 'default';
      this.videoSource.mediaStream = userMedia;
    } catch (error) {
      console.log(error);
      this.deviceError =
        'Der Zugriff auf das Gerät war nicht erfolgreich. Eventuell wird das Gerät von einem anderen Programm verwendet.';
    }

    this.videoinputs = await this.recorderService.getDevices('videoinput');

    if (this.videoinputs.length > 0) {
      this.currentInput = this.videoinputs[0];
      await this.resetVideoSourceDevice(this.videoinputs[0]);
    } else {
      // TODO permissions ? keine geräte ? show error
      this.loadingError =
        'Es konnten keine Videogeräte gefunden werden. Entweder sind keine Berechtigungen gesetzt oder ist kein Videogerät angeschlossen!';
    }

    this.loading = false;
  }

  async resetVideoSourceDevice(mediaDeviceInfo: MediaDeviceInfo) {
    this.deviceError = null;

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
    this.resetVideoSourceDevice(this.currentInput);
  }

  onClickTryAgain() {
    this.load();
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
