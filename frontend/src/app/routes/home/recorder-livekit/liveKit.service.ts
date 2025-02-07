import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  createLocalAudioTrack,
  createLocalScreenTracks,
  createLocalVideoTrack,
  LocalTrackPublication,
  Room,
} from 'livekit-client';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api/api.service';
import { MediaCategory } from 'src/app/services/api/entities/project.entity';
import { AddAudioSourceComponent } from './dialogs/add-audio-source/add-audio-source.component';
import { AddScreensharingSourceComponent } from './dialogs/add-screensharing-source/add-screensharing-source.component';
import { AddVideoSourceComponent } from './dialogs/add-video-source/add-video-source.component';
import { AudioSource, ScreenSource, VideoSource } from './recorder.interfaces';

@Injectable({
  providedIn: 'root',
})
export class LiveKitService {
  private room!: Room;

  public sessionInProgess = false;

  private _videoSourceMap: Map<string, VideoSource> = new Map();
  private _screenSourceMap: Map<string, ScreenSource> = new Map();
  private _audioSourceMap: Map<string, AudioSource> = new Map();

  get screenSourceMap() {
    return this._screenSourceMap;
  }

  get videoSourceMap() {
    return this._videoSourceMap;
  }

  get audioSourceMap() {
    return this._audioSourceMap;
  }

  constructor(private api: ApiService, public dialog: MatDialog) {}

  async init(projectId: string) {
    this.room = new Room();

    const res = await firstValueFrom(
      this.api.authenticateLivekit('6200e98c9f6b0de828dbe34a')
    );
    await this.room.connect(res.url, res.authToken);
  }

  // TODO add reInit

  async addVideoTrack() {
    const selectedVideoData: {
      title: string;
      label: string;
      deviceId: string;
      mediaCategory: MediaCategory;
    } = await lastValueFrom(
      this.dialog.open(AddVideoSourceComponent).afterClosed()
    );

    if (!selectedVideoData) return;

    const videoTrack = await createLocalVideoTrack({
      deviceId: selectedVideoData.deviceId,
    });

    const videoPublication = await this.room.localParticipant.publishTrack(
      videoTrack
    );

    let newVideoSource: VideoSource = {
      id: videoPublication.track!.sid!,
      type: 'video',
      title: selectedVideoData.title,
      label: selectedVideoData.label,
      mediaCategory: selectedVideoData.mediaCategory,
      videoTrack: videoPublication.track!,
    };

    this._videoSourceMap.set(newVideoSource.id, newVideoSource);
  }

  async addAudioTrack() {
    const selectedAudioData: {
      title: string;
      label: string;
      deviceId: string;
    } = await lastValueFrom(
      this.dialog.open(AddAudioSourceComponent).afterClosed()
    );

    if (!selectedAudioData) return;

    const audioTrack = await createLocalAudioTrack({
      deviceId: selectedAudioData.deviceId,
      echoCancellation: true,
      noiseSuppression: true,
    });

    const audioPublication = await this.room.localParticipant.publishTrack(
      audioTrack
    );

    let newAudioSource: AudioSource = {
      id: audioPublication.track!.sid!,
      type: 'audio',
      title: selectedAudioData.title,
      label: selectedAudioData.label,
      audioTrack: audioPublication.track!,
    };

    this._audioSourceMap.set(newAudioSource.id, newAudioSource);
  }

  async getDevices(
    type: 'audioinput' | 'videoinput'
  ): Promise<MediaDeviceInfo[]> {
    let enumerate = await navigator.mediaDevices.enumerateDevices();
    enumerate = enumerate.filter((device) => device.deviceId !== '');

    return type
      ? enumerate.filter((device) => device.kind === type)
      : enumerate;
  }

  async addScreenTrack() {
    const screensharingTracks = await createLocalScreenTracks({
      audio: true,
      video: true,
    });

    const confirm: null | { title: string; mediaCategory: MediaCategory } =
      await lastValueFrom(
        this.dialog
          .open(AddScreensharingSourceComponent, {
            data: screensharingTracks,
          })
          .afterClosed()
      );

    let videoPublication: LocalTrackPublication | null = null;

    if (confirm) {
      videoPublication = await this.room.localParticipant.publishTrack(
        screensharingTracks[0]
      );

      let newScreenSource: ScreenSource = {
        id: videoPublication.track!.sid!,
        type: 'screen',
        title: confirm.title,
        mediaCategory: confirm.mediaCategory,
        videoTrack: videoPublication.track!,
      };

      if (screensharingTracks[1]) {
        const audioPublication = await this.room.localParticipant.publishTrack(
          screensharingTracks[1]
        );

        // connect audio to video
        newScreenSource.audioTrack = audioPublication.track!;
      }

      this.screenSourceMap.set(newScreenSource.id, newScreenSource);
    }
  }

  removeTrack(mediaSource: AudioSource | VideoSource | ScreenSource) {
    if (mediaSource.type === 'screen') {
      if (mediaSource.audioTrack) {
        this.room.localParticipant.unpublishTrack(mediaSource.audioTrack);
      }

      this.room.localParticipant.unpublishTrack(mediaSource.videoTrack);
      this.screenSourceMap.delete(mediaSource.id);
    } else if (mediaSource.type === 'video') {
      this.room.localParticipant.unpublishTrack(mediaSource.videoTrack);
      this._videoSourceMap.delete(mediaSource.id);
    } else {
      this.room.localParticipant.unpublishTrack(mediaSource.audioTrack);
      this._audioSourceMap.delete(mediaSource.id);
    }
  }

  changeMediaCategory(
    mediaSource: VideoSource | ScreenSource,
    mediaCategory: MediaCategory
  ) {
    mediaSource.mediaCategory = mediaCategory;

    if (mediaSource.type === 'screen') {
      this._screenSourceMap.set(mediaSource.id, mediaSource);
    } else {
      this._videoSourceMap.set(mediaSource.id, mediaSource);
    }
  }

  destroy() {
    this.room.disconnect();
  }
}
