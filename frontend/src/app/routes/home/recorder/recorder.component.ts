import { Component, OnInit } from '@angular/core';

export interface MediaComponent {
  title: string;
  srcObject: MediaStream;
}

@Component({
  selector: 'app-recorder',
  templateUrl: './recorder.component.html',
  styleUrls: ['./recorder.component.scss'],
})
export class RecorderComponent implements OnInit {
  loading = true;

  videos: MediaComponent[] = [];
  screens: MediaComponent[] = [];
  audios: MediaComponent[] = [];

  audioInputs: MediaDeviceInfo[] = [];
  videoInputs: MediaDeviceInfo[] = [];

  async ngOnInit() {
    const enumerateDevices = await navigator.mediaDevices.enumerateDevices();
    this.audioInputs = enumerateDevices.filter(
      (device) => device.kind === 'audioinput'
    );
    this.videoInputs = enumerateDevices.filter(
      (device) => device.kind === 'videoinput'
    );

    this.loading = false;
  }

  onStartMicrophone(deviceId: string) {
    navigator.mediaDevices
      .getUserMedia({ video: false, audio: { deviceId } })
      .then((stream) => {
        this.audios.push({ title: 'audio', srcObject: stream });
      })
      .catch((err) => {
        console.error(`An error occurred: ${err}`);
      });
  }

  onStartWebcam(deviceId: string) {
    navigator.mediaDevices
      .getUserMedia({ video: { deviceId }, audio: false })
      .then((stream) => {
        this.videos.push({ title: 'video', srcObject: stream });
      })
      .catch((err) => {
        console.error(`An error occurred: ${err}`);
      });
  }

  onStartScreenSharing() {
    navigator.mediaDevices
      .getDisplayMedia({ video: true, audio: true })
      .then((stream) => {
        this.screens.push({ title: 'screensharing', srcObject: stream });
      })
      .catch((err) => {
        console.error(`An error occurred: ${err}`);
      });
  }
}
