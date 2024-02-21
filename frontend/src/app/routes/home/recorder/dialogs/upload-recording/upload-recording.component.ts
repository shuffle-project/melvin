import { CommonModule } from '@angular/common';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
} from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../../../../services/api/api.service';
import { AsrVendors } from '../../../../../services/api/dto/create-transcription.dto';
import { UploadVideoDto } from '../../../../../services/api/dto/upload-video.dto';
import { ProjectEntity } from '../../../../../services/api/entities/project.entity';
import { Recording } from '../../recorder.interfaces';

@Component({
  selector: 'app-upload-recording',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressBarModule,
    MatButtonModule,
  ],
  templateUrl: './upload-recording.component.html',
  styleUrl: './upload-recording.component.scss',
})
export class UploadRecordingComponent implements OnInit {
  readyToUpload = false;
  uploading = false;
  uploadingDone = false;

  constructor(
    public dialogRef: MatDialogRef<UploadRecordingComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { title: string; language: string; recordings: Recording[] },
    public api: ApiService
  ) {
    console.log(data);
  }

  async ngOnInit() {
    const timer = setInterval(() => {
      this.checkReady();
      if (this.readyToUpload) {
        clearInterval(timer);
      }
    }, 1000);
  }

  checkReady() {
    this.readyToUpload = this.data.recordings.every(
      (recording) => recording.complete
    );
  }

  onClose() {
    this.dialogRef.close();
  }

  async onUploadRecording() {
    this.uploading = true;

    const newProject: ProjectEntity = await this.createProject(
      this.data.recordings[0],
      this.data.title,
      this.data.language
    );

    this.data.recordings.forEach((rec, i) => {
      if (i === 0) return;
      // TODO upload rec as extra video
      console.log(newProject.id);
      console.log('todo upload video to created project');

      this.uploadAdditionalFile(rec, newProject);
    });
  }

  async createProject(rec: Recording, title: string, language: string) {
    const formData: FormData = this.buildFormData(rec, title, language);

    this.api.createProject(formData).subscribe({
      next: (event: HttpEvent<ProjectEntity>) =>
        this._onNextHttpEvent(event, rec),
      error: (error: HttpErrorResponse) => this._onErrorHttpEvent(rec, error),
    });

    // TODO wait until upload is done
    while (!rec.upload.result) {
      await this.waitMS(1000);
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

        if (this.data.recordings.every((rec) => rec.upload.result)) {
          this.uploadingDone = true;
        }
        break;

      default:
        break;
    }
  }

  _onErrorHttpEvent(rec: Recording, error: HttpErrorResponse) {
    rec.upload.error = error;
  }

  private async waitMS(ms: number) {
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, ms);
    });
  }
}
