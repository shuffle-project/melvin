import {
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
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
import { Track } from 'livekit-client';
import { MediaCategoryPipe } from 'src/app/pipes/media-category-pipe/media-category.pipe';
import { MediaCategory } from '../../../../../services/api/entities/project.entity';
import { AudioMeterComponent } from '../../components/audio-meter/audio-meter.component';

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
    MediaCategoryPipe,
  ],
})
export class AddScreensharingSourceComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  videoTrack: Track | null = null;
  audioTrack: Track | null = null;

  MediaCategory = MediaCategory;
  mediaCategoryArray = Object.entries(MediaCategory)
    .map(([label, value]) => value)
    .filter((category) => category !== MediaCategory.MAIN);

  title = 'Screensharing title'; // TODO i18n
  mediaCategory = MediaCategory.SLIDES;

  constructor(
    public dialogRef: MatDialogRef<AddScreensharingSourceComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: Track[]
  ) {}

  ngOnInit() {
    const [videoTrack, audioTrack] = this.data;
    this.videoTrack = videoTrack;
    this.audioTrack = audioTrack;
  }

  ngAfterViewInit() {
    if (this.videoElement) {
      this.videoTrack?.attach(this.videoElement.nativeElement);
    }
  }

  ngOnDestroy() {}

  onCloseDialog() {
    this.dialogRef.close();
  }
  onSubmitDialog() {
    this.dialogRef.close({
      title: this.title,
      mediaCategory: this.mediaCategory,
    });
  }
}
