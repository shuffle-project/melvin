import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { v4 } from 'uuid';
import { MediaCategory } from '../../../../../services/api/entities/project.entity';
import { AudioMeterComponent } from '../../components/audio-meter/audio-meter.component';
import { ScreensharingSource } from '../../recorder.interfaces';
import { RecorderService } from '../../recorder.service';

@Component({
    selector: 'app-add-screensharing-source',
    templateUrl: './add-screensharing-source.component.html',
    styleUrls: ['./add-screensharing-source.component.scss'],
    imports: [
        AudioMeterComponent,
        MatIconModule,
        MatDialogModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        FormsModule,
        MatInputModule,
    ]
})
export class AddScreensharingSourceComponent implements OnInit, OnDestroy {
  MediaCategory = MediaCategory;
  loading = true;
  loadingError: any | null = null;

  screensharingSource: ScreensharingSource = {
    type: 'screensharing',
    id: v4(),
    title: 'Screensharing title',
    mediaCategory: MediaCategory.SLIDES,
    mediaStream: null,
    sound: false,
  };

  constructor(
    public dialogRef: MatDialogRef<AddScreensharingSourceComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {},
    private recorderService: RecorderService
  ) {}

  ngOnInit() {
    this.fetchStream();
  }

  ngOnDestroy() {
    this.screensharingSource.mediaStream
      ?.getTracks()
      .forEach((track) => track.stop());
  }

  async fetchStream() {
    this.loading = true;
    this.loadingError = null;

    try {
      this.screensharingSource.mediaStream =
        await navigator.mediaDevices.getDisplayMedia({
          audio: true,
          video: true,
        });

      this.screensharingSource.sound =
        this.screensharingSource.mediaStream.getAudioTracks().length > 0;
    } catch (error) {
      if (error instanceof DOMException) {
        this.loadingError = 'Permission denied.';
      } else {
        this.loadingError = error;
      }
    }
    this.loading = false;
  }

  onCloseDialog() {
    this.dialogRef.close();
  }
  onSubmitDialog() {
    this.recorderService.screensharings.push({ ...this.screensharingSource });
    this.screensharingSource.mediaStream = null;

    this.dialogRef.close();
  }
}
