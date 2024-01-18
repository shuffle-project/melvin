import { DatePipe } from '@angular/common';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
} from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HeaderComponent } from '../../../components/header/header.component';
import { ApiService } from '../../../services/api/api.service';
import { AsrVendors } from '../../../services/api/dto/create-transcription.dto';
import {
  MediaCategory,
  ProjectEntity,
} from '../../../services/api/entities/project.entity';
import { MediaSourceComponent } from './components/media-source/media-source.component';
import { AddAudioSourceComponent } from './dialogs/add-audio-source/add-audio-source.component';
import { AddScreensharingSourceComponent } from './dialogs/add-screensharing-source/add-screensharing-source.component';
import { AddVideoSourceComponent } from './dialogs/add-video-source/add-video-source.component';
import { RecorderService } from './recorder.service';

interface Recording {
  title: string;
  category: MediaCategory;
  mediaRecorder: MediaRecorder;
  chunks: Blob[];
  finished: boolean;
}

@Component({
  selector: 'app-recorder',
  templateUrl: './recorder.component.html',
  styleUrls: ['./recorder.component.scss'],
  standalone: true,
  imports: [
    MediaSourceComponent,
    DatePipe,
    HeaderComponent,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
})
export class RecorderComponent implements OnInit, OnDestroy {
  today = new Date();
  videoMimeType = 'video/webm';
  //   "video/webm;codecs=vp8",
  // "video/webm;codecs=daala",
  // "video/webm;codecs=h264",
  // "video/x-matroska;codecs=avc1"
  // 'video/mp4; codecs="avc1.424028, mp4a.40.2';
  // "audio/webm;codecs=opus",
  // "video/mpeg",

  loading = true;
  recording = false;
  // mediaRecorder: MediaRecorder | null = null;
  // chunks: Blob[] = [];

  recordings: Recording[] = [];

  // mediaRecorders: MediaRecorder[] = [];

  constructor(
    public dialog: MatDialog,
    public recorderService: RecorderService,
    private api: ApiService
  ) {}

  async ngOnInit() {
    this.loading = false;
  }

  ngOnDestroy(): void {
    this.recorderService.resetData();
  }

  onAddAudioSource() {
    this.dialog.open(AddAudioSourceComponent, {
      data: {},
    });
  }

  onAddVideoSource() {
    this.dialog.open(AddVideoSourceComponent, {
      data: {},
    });
  }

  onAddScreenSharingSource() {
    this.dialog.open(AddScreensharingSourceComponent, {
      data: {},
    });
  }

  onClickStartRecord() {
    if (this.recording) return;

    // build main audio + video

    const audioStreams: MediaStream[] = [];
    this.recorderService.audios.forEach((audio) => {
      if (audio.mediaStream) audioStreams.push(audio.mediaStream);
    });
    this.recorderService.screensharings.forEach((screensharing) => {
      if (
        screensharing.mediaStream?.getAudioTracks() &&
        screensharing.mediaStream?.getAudioTracks().length > 0
      ) {
        audioStreams.push(screensharing.mediaStream);
      } else {
      }
    });

    const allVisualSources = [
      ...this.recorderService.screensharings,
      ...this.recorderService.videos,
    ];

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

    console.log('stream counter', allStreams.length);

    allStreams.forEach((streamToRecord) => {
      const chunks: Blob[] = [];
      const mediaRecorder = new MediaRecorder(streamToRecord.stream);

      const recording: Recording = {
        mediaRecorder,
        chunks,
        title: streamToRecord.source.title,
        category: streamToRecord.source.mediaCategory,
        finished: false,
      };

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.onstop = (e) => this.onStopSaveRecording(e, recording);

      mediaRecorder.start();

      this.recordings.push(recording);
      // this.mediaRecorders.push(mediaRecorder);

      this.recording = true;
    });
  }

  async onClickStopRecord() {
    if (!this.recording) return;

    this.recordings.forEach((recording) => {
      recording.mediaRecorder.stop();
    });
  }

  onStopSaveRecording(e: Event, recording: Recording) {
    recording.finished = true;

    if (!this.recordings.some((rec) => rec.finished === false))
      this.finishRecording();
  }

  async finishRecording() {
    const newProject: ProjectEntity | null = await this.createProject();

    if (!newProject) return; // TODO

    this.recordings.forEach((rec, i) => {
      if (i === 0) return;
      // TODO upload rec as extra video
      console.log(newProject.id);
      console.log('todo upload video to created project');

      this.uploadAdditionalFile(rec, newProject);
    });

    // cleanup
    this.recordings = [];
    this.recording = false;
  }

  private uploadAdditionalFile(rec: Recording, newProject: ProjectEntity) {
    const recFile = new File(rec.chunks, 'video.webm', {
      type: 'video/webm',
    });

    this.api
      .uploadVideo(
        newProject.id,
        {
          title: rec.title,
          category: rec.category,
        },
        recFile
      )
      .subscribe({
        next: (event: HttpEvent<ProjectEntity>) =>
          console.log(rec.title, event),
        error: (error: HttpErrorResponse) => console.log(rec.title, error),
      });
  }

  private async createProject() {
    const data = {
      title: 'testtitle',
      language: 'de',
      sourceMode: 'video',
      asrVendor: AsrVendors.WHISPER,
      asrLanguage: 'de',
      videoLanguage: 'de',
    };

    const formData: FormData = new FormData();
    Object.entries(data).forEach((o) => {
      const key = o[0];
      const value = o[1];
      formData.append(key, value);
    });

    const file = new File(this.recordings[0].chunks, 'video.webm', {
      type: 'video/webm',
    });

    formData.append('video', file, 'video.webm');

    const newProject: ProjectEntity | null = await new Promise(
      (resolve, reject) => {
        this.api.createProject(formData).subscribe({
          next: (event: HttpEvent<ProjectEntity>) => {
            switch (event.type) {
              case HttpEventType.Response:
                resolve(event.body);
                break;

              default:
                // reject('dunno');
                //
                break;
            }

            console.log(event);
          },
          error: (error: HttpErrorResponse) => {
            reject(error.error);
          },
        });
      }
    );
    return newProject;
  }

  onClickReady() {
    this.recorderService.mode = 'record';
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
}
