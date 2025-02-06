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
import { AddScreensharingSourceComponent } from './dialogs/add-screensharing-source/add-screensharing-source.component';
import { AudioSource, ScreenSource, VideoSource } from './recorder.interfaces';

@Injectable({
  providedIn: 'root',
})
export class LiveKitService {
  private room!: Room;

  public sessionInProgess = false;

  public videoSourceMap: Map<string, VideoSource> = new Map();
  public screenSourceMap: Map<string, ScreenSource> = new Map();
  public audioSourceMap: Map<string, AudioSource> = new Map();

  constructor(private api: ApiService, public dialog: MatDialog) {}

  async init(projectId: string) {
    this.room = new Room();

    const res = await firstValueFrom(this.api.getLivekitToken());
    await this.room.connect(res.url, res.authToken);
  }

  // TODO add reInit

  async addVideoTrack(selectedVideoDeviceId: string) {
    const videoTrack = await createLocalVideoTrack({
      deviceId: selectedVideoDeviceId,
    });

    const videoPublication = await this.room.localParticipant.publishTrack(
      videoTrack
    );
  }

  async addAudioTrack(selectedAudioDeviceId: string) {
    const audioTrack = await createLocalAudioTrack({
      deviceId: selectedAudioDeviceId,
      echoCancellation: true,
      noiseSuppression: true,
    });

    const audioPublication = await this.room.localParticipant.publishTrack(
      audioTrack
    );
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

      console.log(videoPublication.track!.mediaStreamTrack.getSettings());

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
      this.videoSourceMap.delete(mediaSource.id);
    } else {
      this.room.localParticipant.unpublishTrack(mediaSource.audioTrack);
      this.audioSourceMap.delete(mediaSource.id);
    }
  }

  destroy() {
    this.room.disconnect();
  }
}
