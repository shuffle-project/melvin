import { Injectable } from '@angular/core';
import { MediaCategory } from '../../../services/api/entities/project.entity';
import {
  AudioSource,
  ScreensharingSource,
  VideoSource,
} from './recorder.interfaces';

@Injectable({
  providedIn: 'root',
})
export class RecorderService {
  public mode: 'setup' | 'record' = 'setup';

  // devices
  private enumeratedDevices: MediaDeviceInfo[] | null = null;
  public videos: VideoSource[] = [];
  public audios: AudioSource[] = [];
  public screensharings: ScreensharingSource[] = [];

  //recording

  constructor() {
    this.reloadDevices();
  }

  /**
   * devices
   */

  reloadDevices() {
    this.enumeratedDevices = null;
    navigator.mediaDevices
      .enumerateDevices()
      .then((enumerated) => {
        this.enumeratedDevices = enumerated.filter(
          (device) => device.deviceId !== ''
        );
      })
      .finally(() => {
        if (!this.enumeratedDevices) this.enumeratedDevices = [];
      });
  }

  async getDevices(
    type?: 'audioinput' | 'videoinput'
  ): Promise<MediaDeviceInfo[]> {
    while (!this.enumeratedDevices) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return type
      ? this.enumeratedDevices.filter((device) => device.kind === type)
      : this.enumeratedDevices;
  }

  resetData() {
    [...this.videos, ...this.screensharings, ...this.audios].forEach((obj) => {
      if (obj.mediaStream)
        obj.mediaStream.getTracks().forEach((track) => track.stop());
    });

    this.videos = [];
    this.audios = [];
    this.screensharings = [];
  }

  updateMediaCategoryById(id: string, mediaCategory: MediaCategory) {
    const foundVideo = this.videos.find((obj) => obj.id === id);
    if (foundVideo) foundVideo.mediaCategory = mediaCategory;

    const foundScreensharing = this.screensharings.find((obj) => obj.id === id);
    if (foundScreensharing) foundScreensharing.mediaCategory = mediaCategory;
  }

  removeById(id: string) {
    const v = this.videos.findIndex((x) => x.id === id);
    if (v >= 0) {
      this.stopMediastream(this.videos[v].mediaStream);
      this.videos.splice(v, 1);
    }

    const a = this.audios.findIndex((x) => x.id === id);
    if (a >= 0) {
      this.stopMediastream(this.audios[a].mediaStream);
      this.audios.splice(v, 1);
    }

    const s = this.screensharings.findIndex((x) => x.id === id);
    if (s >= 0) {
      this.stopMediastream(this.screensharings[s].mediaStream);
      this.screensharings.splice(v, 1);
    }
  }

  stopMediastream(mediaStream: MediaStream | null) {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
  }

  /**
   * recording
   */
}
