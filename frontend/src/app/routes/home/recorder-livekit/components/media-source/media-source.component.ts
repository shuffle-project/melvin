import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MediaCategoryPipe } from 'src/app/pipes/media-category-pipe/media-category.pipe';
import { MediaCategory } from '../../../../../services/api/entities/project.entity';
import { LiveKitService } from '../../liveKit.service';
import {
  AudioSource,
  ScreenSource,
  VideoSource,
} from '../../recorder.interfaces';
import { AudioMeterComponent } from '../audio-meter/audio-meter.component';

@Component({
  selector: 'app-media-source',
  templateUrl: './media-source.component.html',
  styleUrls: ['./media-source.component.scss'],
  imports: [
    MatChipsModule,
    AudioMeterComponent,
    MatIconModule,
    MatMenuModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    FormsModule,
    MatInputModule,
    MediaCategoryPipe,
  ],
})
export class MediaSourceComponent implements OnInit, AfterViewInit {
  @ViewChild('screenVideo') screenVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('video') video!: ElementRef<HTMLVideoElement>;

  MediaCategory = MediaCategory;
  mediaCategoryArray = Object.entries(MediaCategory)
    .map(([label, value]) => value)
    .filter((category) => category !== MediaCategory.MAIN);

  @Input({ required: true }) mediaSource!:
    | AudioSource
    | VideoSource
    | ScreenSource;

  audioSource: AudioSource | null = null;
  videoSource: VideoSource | null = null;
  screenSource: ScreenSource | null = null;

  constructor(public liveKitService: LiveKitService) {}

  ngOnInit() {
    switch (this.mediaSource['type']) {
      case 'audio':
        this.audioSource = this.mediaSource as AudioSource;
        break;
      case 'video':
        this.videoSource = this.mediaSource as VideoSource;
        break;
      case 'screen':
        this.screenSource = this.mediaSource as ScreenSource;
        break;
    }
  }

  ngAfterViewInit(): void {
    if (this.screenSource) {
      this.screenSource.videoTrack.attach(this.screenVideo.nativeElement);
    }

    if (this.videoSource) {
      this.videoSource.videoTrack.attach(this.video.nativeElement);
    }
  }

  onRemoveMediaSource() {
    this.liveKitService.removeTrack(this.mediaSource);
  }

  onChangeCategory(mediaCategory: MediaCategory) {
    if (this.mediaSource.type !== 'audio') {
      this.liveKitService.changeMediaCategory(this.mediaSource, mediaCategory);
    }
  }
}
