import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  AudioSource,
  ScreensharingSource,
  VideoSource,
} from '../../recorder.interfaces';
import { RecorderService } from '../../recorder.service';

@Component({
  selector: 'app-media-source',
  templateUrl: './media-source.component.html',
  styleUrls: ['./media-source.component.scss'],
})
export class MediaSourceComponent implements OnInit {
  @Input({ required: true }) mediaSource!:
    | AudioSource
    | VideoSource
    | ScreensharingSource;

  @Output() removeMediaSourceElement = new EventEmitter<void>();

  audioSource: AudioSource | null = null;
  videoSource: VideoSource | null = null;
  screensharingSource: ScreensharingSource | null = null;

  constructor(public recorderService: RecorderService) {
    // if( this.mediaSource instanceof AudioSource){
    // }
  }

  ngOnInit() {
    switch (this.mediaSource['type']) {
      case 'audio':
        this.audioSource = this.mediaSource as AudioSource;
        break;
      case 'video':
        this.videoSource = this.mediaSource as VideoSource;
        break;
      case 'screensharing':
        this.screensharingSource = this.mediaSource as ScreensharingSource;
        break;
    }
  }

  onRemoveMediaSource() {
    this.recorderService.removeById(this.mediaSource.id);
  }
}
