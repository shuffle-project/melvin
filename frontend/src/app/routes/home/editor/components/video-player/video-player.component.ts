import { DOCUMENT } from '@angular/common';
import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app.state';
import * as editorSelectors from '../../../../../store/selectors/editor.selector';
import { MediaService } from '../../services/media/media.service';
import * as editorActions from './../../../../../store/actions/editor.actions';
import { VideoPlayerMediaElementComponent } from './video-player-media-element/video-player-media-element.component';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss'],
})
export class VideoPlayerComponent implements OnInit {
  @ViewChild('mediaElement')
  mediaElement!: ElementRef<VideoPlayerMediaElementComponent>;

  public isPlaying$ = this.store.select(editorSelectors.selectIsPlaying);
  public duration$ = this.store.select(editorSelectors.selectDuration);
  public volume$ = this.store.select(editorSelectors.selectVolume);
  public currentSpeed$ = this.store.select(editorSelectors.selectCurrentSpeed);
  public currentTime$ = this.mediaService.currentTime$;
  public currentCaption$ = this.mediaService.currentCaption$;

  public subtitlesEnabled$ = this.store.select(
    editorSelectors.selectSubtitlesEnabledInVideo
  );
  public showPictureInPictureButton = !!this.document.exitPictureInPicture;

  public speedOptions: number[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  constructor(
    private store: Store<AppState>,
    @Inject(DOCUMENT) private document: Document,
    private mediaService: MediaService
  ) {}

  ngOnInit(): void {}

  // onChangeVideoProgress(event: MatSliderChange) {
  //   this.mediaService.seekToTime(event.value as number, true);
  // }

  onClickPlayPause() {
    this.store.dispatch(editorActions.togglePlayPauseFromVideo());
  }

  onClickToggleVolume() {
    this.store.dispatch(editorActions.toggleVolumeFromVideoComponent());
  }

  onChangeVolume(event: any) {
    this.store.dispatch(
      editorActions.changeVolumeFromVideoComponent({
        volume: event.target.value,
      })
    );
  }

  onClickToggleSubtitles() {
    this.store.dispatch(editorActions.toggleSubtitlesFromEditor());
  }

  onClickSetPlaybackSpeed(speed: number) {
    this.store.dispatch(editorActions.changeSpeedFromEditor({ speed }));
  }

  async onClickPictureInPicture() {
    this.mediaElement.nativeElement.togglePictureInPicture();
  }
}
