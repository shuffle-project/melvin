import { DOCUMENT } from '@angular/common';
import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app.state';
import * as editorSelectors from '../../../../../store/selectors/editor.selector';
import { MediaService } from '../../service/media/media.service';
import { VideoPlayerMediaElementComponent } from './video-player-media-element/video-player-media-element.component';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss'],
  imports: [
    VideoPlayerMediaElementComponent,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    MatSliderModule,
    MatMenuModule,
  ],
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

  constructor(
    private store: Store<AppState>,
    @Inject(DOCUMENT) private document: Document,
    private mediaService: MediaService
  ) {}

  ngOnInit(): void {}

  async onClickPictureInPicture() {
    this.mediaElement.nativeElement.togglePictureInPicture();
  }
}
