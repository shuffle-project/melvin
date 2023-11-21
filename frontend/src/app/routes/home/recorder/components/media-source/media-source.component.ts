import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  AudioSource,
  ScreensharingSource,
  VideoSource,
} from '../../recorder.interfaces';

@Component({
  selector: 'app-media-source',
  templateUrl: './media-source.component.html',
  styleUrls: ['./media-source.component.scss'],
})
export class MediaSourceComponent implements OnInit {
  @Input({ required: true }) readonly!: boolean;
  @Input({ required: true }) mediaSource!:
    | AudioSource
    | VideoSource
    | ScreensharingSource;

  @Output() removeMediaSourceElement = new EventEmitter<void>();

  audioSource: AudioSource | null = null;
  videoSource: VideoSource | null = null;
  ScreensharingSource: ScreensharingSource | null = null;

  constructor() {
    // if( this.mediaSource instanceof AudioSource){
    // }
  }

  ngOnInit() {}

  onRemoveMediaSource() {
    this.removeMediaSourceElement.emit();
  }
}
