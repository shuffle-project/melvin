import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MediaCategoryPipe } from 'src/app/pipes/media-category-pipe/media-category.pipe';
import { MediaCategory } from '../../../../../services/api/entities/project.entity';
import { LiveKitService } from '../../liveKit.service';

@Component({
  selector: 'app-add-video-source',
  templateUrl: './add-video-source.component.html',
  styleUrls: ['./add-video-source.component.scss'],
  imports: [
    MatIconModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    FormsModule,
    MatInputModule,
    MediaCategoryPipe,
  ],
})
export class AddVideoSourceComponent implements OnInit, OnDestroy {
  MediaCategory = MediaCategory;
  mediaCategoryArray = Object.entries(MediaCategory)
    .map(([label, value]) => value)
    .filter((category) => category !== MediaCategory.MAIN);

  loading = true;
  loadingError: any | null = null;
  deviceError: any | null = null;

  videoinputs: MediaDeviceInfo[] = [];

  currentInput!: MediaDeviceInfo;

  title = '';
  label = '';
  deviceId = '';
  mediaStream: MediaStream | null = null;
  mediaCategory: MediaCategory = MediaCategory.SPEAKER;

  constructor(
    public dialogRef: MatDialogRef<AddVideoSourceComponent>,
    private liveKitService: LiveKitService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  ngOnDestroy() {
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
  }

  async load() {
    this.loading = true;
    this.loadingError = null;
    this.deviceError = null;

    try {
      const userMedia = await navigator.mediaDevices.getUserMedia({
        // TODO which is the correct framerate?
        video: { frameRate: 25 },
        audio: false,
      });

      this.title = 'Video ' + (this.liveKitService.videoSourceMap.size + 1);
      this.deviceId = userMedia.id;
      this.label = 'default';
      this.mediaStream = userMedia;
    } catch (error) {
      console.log(error);
      this.deviceError = $localize`:@@recorderAddVideoDeviceError:Access to the device failed. The device may be used by another program.`;
    }

    this.videoinputs = await this.liveKitService.getDevices('videoinput');

    if (this.videoinputs.length > 0) {
      this.currentInput = this.videoinputs[0];
      await this.resetVideoSourceDevice(this.videoinputs[0]);
    } else {
      this.loadingError = $localize`:@@recorderAddVideoLoadingError:No video devices found. Either the permissions are not set or no video device is connected!`;
    }

    this.loading = false;
  }

  async resetVideoSourceDevice(mediaDeviceInfo: MediaDeviceInfo) {
    this.deviceError = null;

    this.deviceId = mediaDeviceInfo.deviceId;
    this.label = mediaDeviceInfo.label;

    // remove old stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    // create new stream
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { deviceId: mediaDeviceInfo.deviceId },
      });
    } catch (error) {
      this.deviceError = error;
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
    this.dialogRef.close({
      title: this.title,
      label: this.label,
      deviceId: this.deviceId,
      mediaCategory: this.mediaCategory,
    });
  }
}
