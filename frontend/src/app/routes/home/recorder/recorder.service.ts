import {
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../../services/api/api.service';
import { AsrVendors } from '../../../services/api/dto/create-transcription.dto';
import { UploadVideoDto } from '../../../services/api/dto/upload-video.dto';
import {
  MediaCategory,
  ProjectEntity,
} from '../../../services/api/entities/project.entity';
import { UploadInformationComponent } from './dialogs/upload-information/upload-information.component';
import {
  AudioSource,
  Recording,
  ScreensharingSource,
  VideoSource,
} from './recorder.interfaces';

@Injectable({
  providedIn: 'root',
})
export class RecorderService {
  public editMode = true;
  public recording = false;

  public title: string = '';
  public language: string = 'de';

  // devices
  private enumeratedDevices: MediaDeviceInfo[] | null = null;

  public videos: VideoSource[] = [];
  public audios: AudioSource[] = [];
  public screensharings: ScreensharingSource[] = [];

  //recording
  recordings: Recording[] = [];

  constructor(private api: ApiService, public dialog: MatDialog) {
    this.reloadDevices();
  }

  /**
   * manage devices
   */

  async reloadDevices() {
    this.enumeratedDevices = null;

    await navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((x) => x.getTracks().forEach((tr) => tr.stop()));

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

  stopRecording(title: string, langauge: string) {
    if (!this.recording) return;

    this.title = title;
    this.language = langauge;

    this.recordings.forEach((recording) => {
      recording.mediaRecorder.stop();
    });

    // TODO
    this.dialog.open(UploadInformationComponent, { data: this.recordings });
  }

  async finishRecording() {
    const newProject: ProjectEntity = await this.createProject(
      this.recordings[0],
      this.title,
      this.language
    );

    this.recordings.forEach((rec, i) => {
      if (i === 0) return;
      // TODO upload rec as extra video
      console.log(newProject.id);
      console.log('todo upload video to created project');

      this.uploadAdditionalFile(rec, newProject);
    });

    this.recording = false;
  }

  startRecording() {
    if (this.recording) return;

    // cleanup;
    this.recordings = []; // TODO

    // build main audio + video

    const audioStreams: MediaStream[] = [];
    this.audios.forEach((audio) => {
      if (audio.mediaStream) audioStreams.push(audio.mediaStream);
    });
    this.screensharings.forEach((screensharing) => {
      if (
        screensharing.mediaStream?.getAudioTracks() &&
        screensharing.mediaStream?.getAudioTracks().length > 0
      ) {
        audioStreams.push(screensharing.mediaStream);
      } else {
      }
    });

    const allVisualSources = [...this.screensharings, ...this.videos];

    const mainAudioTracks = this.getMergedAudioTracks(...audioStreams);
    const mainVisualSource = allVisualSources[0];
    const mainVideoTracks = mainVisualSource.mediaStream!.getVideoTracks();

    const mainStream = new MediaStream([
      ...mainAudioTracks, // all audios
      ...mainVideoTracks, // main video
    ]);

    // this

    const allStreams = [{ source: mainVisualSource, stream: mainStream }];
    allVisualSources.forEach((source, i) => {
      if (i !== 0) allStreams.push({ source, stream: source.mediaStream! });
    });

    allStreams.forEach((streamToRecord) => {
      const chunks: Blob[] = [];
      const mediaRecorder = new MediaRecorder(streamToRecord.stream);

      const recording: Recording = {
        id: streamToRecord.source.id,
        mediaRecorder: mediaRecorder,
        chunks,
        title: streamToRecord.source.title,
        category: streamToRecord.source.mediaCategory,
        complete: false,
        upload: { progress: -1 },
      };
      this.recordings.push(recording);

      mediaRecorder.onerror = (e) => {
        console.log('error in recording');
        console.log(recording);
        console.log(e);
      };
      mediaRecorder.ondataavailable = (e) =>
        this.onDataAvailableMediaRecorder(e, recording);
      mediaRecorder.onstop = (e) => this.onStopMediaRecorder(e, recording);

      mediaRecorder.start();

      this.recording = true;
    });
  }

  onDataAvailableMediaRecorder(e: BlobEvent, recording: Recording) {
    if (e.data.size > 0) recording.chunks.push(e.data);
  }

  onStopMediaRecorder(e: Event, recording: Recording) {
    recording.complete = true;

    // all recordings finished?
    if (!this.recordings.some((rec) => rec.complete === false))
      this.finishRecording();
  }

  getMergedAudioTracks(...streams: MediaStream[]): MediaStreamTrack[] {
    const audioCtx = new AudioContext();
    const destination = audioCtx.createMediaStreamDestination();

    streams.forEach((stream) => {
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(destination);
    });

    return destination.stream.getAudioTracks();
  }

  /**
   * Create projekt
   */

  async createProject(rec: Recording, title: string, language: string) {
    const formData: FormData = this.buildFormData(rec, title, language);

    this.api.createProject(formData).subscribe({
      next: (event: HttpEvent<ProjectEntity>) =>
        this._onNextHttpEvent(event, rec),
      error: (error: HttpErrorResponse) => this._onErrorHttpEvent(rec, error),
    });

    // TODO wait until upload is done
    while (!rec.upload.result) {
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve(null);
        }, 1000);
      });
    }

    return rec.upload.result;
  }

  buildFormData(recording: Recording, title: string, language: string) {
    const data = {
      title: title,
      language: language,
      sourceMode: 'video',
      asrVendor: AsrVendors.WHISPER,
      asrLanguage: language,
      videoLanguage: language,
    };

    const formData: FormData = new FormData();
    Object.entries(data).forEach((o) => {
      const key = o[0];
      const value = o[1];
      formData.append(key, value);
    });

    const file = new File(recording.chunks, 'video.webm', {
      type: 'video/webm',
    });

    formData.append('video', file, 'video.webm');
    return formData;
  }

  uploadAdditionalFile(rec: Recording, newProject: ProjectEntity) {
    const recFile = new File(rec.chunks, 'video.webm', {
      type: 'video/webm',
    });

    const uploadVideoDto: UploadVideoDto = {
      title: rec.title,
      category: rec.category,
    };

    rec.upload.progress = 0;

    this.api.uploadVideo(newProject.id, uploadVideoDto, recFile).subscribe({
      next: (event: HttpEvent<ProjectEntity>) =>
        this._onNextHttpEvent(event, rec),
      error: (error: HttpErrorResponse) => this._onErrorHttpEvent(rec, error),
    });
  }

  _onNextHttpEvent(event: HttpEvent<ProjectEntity>, rec: Recording) {
    switch (event.type) {
      case HttpEventType.UploadProgress:
        if (event.total)
          rec.upload.progress = (event.loaded / event.total) * 100;

        break;
      case HttpEventType.Response:
        rec.upload.progress = 100;
        rec.upload.result = event.body ?? undefined;
        break;

      default:
        break;
    }
  }

  _onErrorHttpEvent(rec: Recording, error: HttpErrorResponse) {
    rec.upload.error = error;
  }
}
