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
import { AudioMeterComponent } from '../../components/audio-meter/audio-meter.component';
import { AudioSource } from '../../recorder.interfaces';
import { RecorderService } from '../../recorder.service';

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
    ]
})
export class AddAudioSourceComponent implements OnInit, OnDestroy {
  private destroy$$ = new Subject<void>();

  loading = true;
  loadingError: any | null = null;
  deviceError: any | null = null;

  audioinputs: MediaDeviceInfo[] = [];
  currentInput!: MediaDeviceInfo;
  audioSource: AudioSource = {
    type: 'audio',
    id: v4(),
    title: 'default audio',
    deviceId: '',
    label: '',
    mediaStream: null,
  };

  constructor(
    public dialogRef: MatDialogRef<AddAudioSourceComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {},
    public recorderService: RecorderService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  ngOnDestroy(): void {
    this.audioSource.mediaStream?.getTracks().forEach((track) => track.stop());
    this.audioSource.mediaStream = null;
    this.destroy$$.next();
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

      this.audioSource.deviceId = userMedia.id;
      this.audioSource.label = 'default';
      this.audioSource.mediaStream = userMedia;
    } catch (error) {
      console.log(error);
      this.deviceError =
        'Der Zugriff auf das Gerät war nicht erfolgreich. Eventuell wird das Gerät von einem anderen Programm verwendet.';
    }

    this.audioinputs = await this.recorderService.getDevices('audioinput');

    if (this.audioinputs.length > 0) {
      this.currentInput = this.audioinputs[0];
      await this.resetAudioSource(this.audioinputs[0]);
    } else {
      // TODO permissions ? keine geräte ? show error
      this.loadingError =
        'Es konnten keine Videogeräte gefunden werden. Entweder sind keine Berechtigungen gesetzt oder ist kein Audiogerät angeschlossen!';
    }
    this.loading = false;
  }

  async resetAudioSource(mediaDeviceInfo: MediaDeviceInfo) {
    this.deviceError = null;

    this.audioSource.deviceId = mediaDeviceInfo.deviceId;
    this.audioSource.label = mediaDeviceInfo.label;

    // remove old stream
    if (this.audioSource.mediaStream) {
      this.audioSource.mediaStream.getTracks().forEach((track) => track.stop());
      this.audioSource.mediaStream = null;
    }

    // create new stream
    try {
      this.audioSource.mediaStream = await navigator.mediaDevices.getUserMedia({
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
    this.recorderService.audios.push({ ...this.audioSource });
    this.audioSource.mediaStream = null;

    this.dialogRef.close();
  }
}
