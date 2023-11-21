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
}
