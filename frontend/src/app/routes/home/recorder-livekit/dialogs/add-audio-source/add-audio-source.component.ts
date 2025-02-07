import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { AudioMeterComponent } from '../../components/audio-meter/audio-meter.component';
import { LiveKitService } from '../../liveKit.service';

@Component({
  selector: 'app-add-audio-source',
  templateUrl: './add-audio-source.component.html',
  styleUrls: ['./add-audio-source.component.scss'],
  imports: [
    AudioMeterComponent,
    MatIconModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    FormsModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
})
export class AddAudioSourceComponent implements OnInit, OnDestroy {
  loading = true;
  loadingError: any | null = null;
  deviceError: any | null = null;

  audioinputs: MediaDeviceInfo[] = [];
  currentInput!: MediaDeviceInfo;

  title = '';
  label = '';
  deviceId = '';
  mediaStream: MediaStream | null = null;

  constructor(
    public dialogRef: MatDialogRef<AddAudioSourceComponent>,
    private liveKitService: LiveKitService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  ngOnDestroy(): void {
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
  }

  async load() {
    this.loading = true;
    this.loadingError = null;
    this.deviceError = null;

    try {
      const userMedia = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });

      this.title = 'Audio ' + (this.liveKitService.audioSourceMap.size + 1);
      this.deviceId = userMedia.id;
      this.label = 'default';
      this.mediaStream = userMedia;
    } catch (error) {
      console.log(error);
      this.deviceError = $localize`:@@recorderAddAudioDeviceError:Access to the device failed. The device may be used by another program.`;
    }

    this.audioinputs = await this.liveKitService.getDevices('audioinput');

    if (this.audioinputs.length > 0) {
      this.currentInput = this.audioinputs[0];
      await this.resetAudioSource(this.audioinputs[0]);
    } else {
      this.loadingError = $localize`:@@recorderAddAudioLoadingError:No audio devices found. Either the permissions are not set or no audio device is connected!`;
    }
    this.loading = false;
  }

  async resetAudioSource(mediaDeviceInfo: MediaDeviceInfo) {
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
        audio: { deviceId: mediaDeviceInfo.deviceId },
        video: false,
      });
    } catch (error) {
      this.deviceError = error;
    }
  }

  onSelectionChange() {
    this.resetAudioSource(this.currentInput);
  }

  onClickTryAgain() {
    this.load();
  }

  onCloseDialog() {
    this.dialogRef.close();
  }
  onSubmitDialog() {
    this.mediaStream = null;

    this.dialogRef.close({
      title: this.title,
      label: this.label,
      deviceId: this.deviceId,
    });
  }
}
