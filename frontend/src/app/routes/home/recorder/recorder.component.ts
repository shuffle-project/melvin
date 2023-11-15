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
  recording = false;
  mediaRecorder: MediaRecorder | null = null;
  chunks: Blob[] = [];

  videos: MediaComponent[] = [];
  screens: MediaComponent[] = [];
  audios: MediaComponent[] = [];

  audioInputs: MediaDeviceInfo[] = [];
  videoInputs: MediaDeviceInfo[] = [];

  async ngOnInit() {
    // navigator.mediaDevices.
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

  onClickStartRecord() {
    if (this.recording) return;

    const allTracks: MediaStreamTrack[] = [];

    this.videos.forEach((element) => {
      allTracks.push(...element.srcObject.getTracks());
    });
    this.audios.forEach((element) => {
      allTracks.push(...element.srcObject.getTracks());
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
}
