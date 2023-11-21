import { Injectable } from '@angular/core';
import {
  AudioSource,
  ScreensharingSource,
  VideoSource,
} from './recorder.interfaces';

@Injectable({
  providedIn: 'root',
})
export class RecorderService {
  public videos: VideoSource[] = [];
  public audios: AudioSource[] = [];
  public screensharings: ScreensharingSource[] = [];

  constructor() {}

  resetData() {
    [...this.videos, ...this.screensharings, ...this.audios].forEach((obj) => {
      if (obj.mediaStream)
        obj.mediaStream.getTracks().forEach((track) => track.stop());
    });

    this.videos = [];
    this.audios = [];
    this.screensharings = [];
  }

  removeById(id: string) {
    const v = this.videos.findIndex((x) => x.id === id);
    if (v >= 0) {
      this.stopStream(this.videos[v].mediaStream);
      this.videos.splice(v, 1);
    }

    const a = this.audios.findIndex((x) => x.id === id);
    if (a >= 0) {
      this.stopStream(this.audios[a].mediaStream);
      this.audios.splice(v, 1);
    }

    const s = this.screensharings.findIndex((x) => x.id === id);
    if (s >= 0) {
      this.stopStream(this.screensharings[s].mediaStream);
      this.screensharings.splice(v, 1);
    }
  }

  stopStream(mediaStream: MediaStream | null) {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
  }
}
