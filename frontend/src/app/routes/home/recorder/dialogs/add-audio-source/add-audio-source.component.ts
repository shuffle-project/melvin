import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { v4 } from 'uuid';
import { AudioSource } from '../../recorder.interfaces';
import { RecorderService } from '../../recorder.service';

@Component({
  selector: 'app-add-audio-source',
  templateUrl: './add-audio-source.component.html',
  styleUrls: ['./add-audio-source.component.scss'],
})
export class AddAudioSourceComponent implements OnInit, OnDestroy {
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
    private recorderService: RecorderService
  ) {}

  async ngOnInit() {
    const enumerateDevices = await navigator.mediaDevices.enumerateDevices();
    this.audioinputs = enumerateDevices.filter(
      (device) => device.kind === 'audioinput'
    );

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

  ngOnDestroy(): void {
    this.audioSource.mediaStream?.getTracks().forEach((track) => track.stop());
    this.audioSource.mediaStream = null;
  }

  async resetAudioSource(mediaDeviceInfo: MediaDeviceInfo) {
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

  onCloseDialog() {
    this.dialogRef.close();
  }
  onSubmitDialog() {
    this.recorderService.audios.push({ ...this.audioSource });
    this.audioSource.mediaStream = null;

    this.dialogRef.close();
  }
}
