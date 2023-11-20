import { Injectable } from '@angular/core';
import { MediaCategory } from '../../../services/api/entities/project.entity';
import { SourceObj } from './recorder.interfaces';

@Injectable({
  providedIn: 'root',
})
export class RecorderService {
  public videos: SourceObj[] = [];
  public screens: SourceObj[] = [];
  public audios: SourceObj[] = [];

  constructor() {}

  resetData() {
    [...this.videos, ...this.screens, ...this.audios].forEach((video) =>
      video.mediaStream.getTracks().forEach((track) => track.stop())
    );

    this.videos = [];
    this.audios = [];
    this.screens = [];
  }

  onStartAudioSource(mediaDeviceInfo: MediaDeviceInfo) {
    navigator.mediaDevices
      .getUserMedia({
        video: false,
        audio: { deviceId: mediaDeviceInfo.deviceId },
      })
      .then((stream) => {
        this.audios.push({
          type: 'audioinput',
          title: 'audio',
          mediaStream: stream,
          mediaDeviceInfo,
        });
      })
      .catch((err) => {
        console.error(`An error occurred: ${err}`);
      });
  }

  onStartVideoSource(
    mediaDeviceInfo: MediaDeviceInfo,
    mediaCategory: MediaCategory
  ) {
    navigator.mediaDevices
      .getUserMedia({
        video: { deviceId: mediaDeviceInfo.deviceId },
        audio: false,
      })
      .then((stream) => {
        this.videos.push({
          type: 'videoinput',
          title: 'video',
          mediaStream: stream,
          mediaDeviceInfo,
          mediaCategory,
        });
      })
      .catch((err) => {
        console.error(`An error occurred: ${err}`);
      });
  }

  onStartScreenSharingSource(mediaCategory: MediaCategory) {
    navigator.mediaDevices
      .getDisplayMedia({ video: true, audio: true })
      .then((stream) => {
        this.screens.push({
          type: 'screensharinginput',
          title: 'screensharing',
          mediaStream: stream,
          mediaCategory,
        });
      })
      .catch((err) => {
        console.error(`An error occurred: ${err}`);
      });
  }
}
