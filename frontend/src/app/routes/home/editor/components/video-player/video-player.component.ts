import { DOCUMENT } from '@angular/common';
import {
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LetDirective, PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import {
  animationFrameScheduler,
  distinctUntilChanged,
  filter,
  fromEvent,
  interval,
  map,
  merge,
  Subject,
  takeUntil,
  tap,
} from 'rxjs';
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
    LetDirective,
    PushPipe,
  ],
})
export class VideoPlayerComponent implements OnInit, OnDestroy {
  private destroy$$ = new Subject<void>();

  @ViewChild('audio', { static: false })
  audioRef!: ElementRef<HTMLAudioElement>;

  get audio(): HTMLAudioElement {
    return this.audioRef.nativeElement;
  }

  @ViewChild('mediaElement')
  mediaElement!: ElementRef<VideoPlayerMediaElementComponent>;

  public media$ = this.store.select(editorSelectors.selectMedia);

  // todo choose audio
  public playingAudio$ = this.media$.pipe(map((media) => media?.audios[0]));

  // public isPlaying$ = this.store.select(editorSelectors.eIsPlayingUser);
  public duration$ = this.store.select(editorSelectors.selectDuration);
  public volume$ = this.store.select(editorSelectors.selectVolume);
  public playbackRate$ = this.store.select(editorSelectors.selectCurrentSpeed);
  public muted$ = this.store.select(editorSelectors.selectMuted);
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
  ngOnDestroy(): void {
    this.destroy$$.next();
  }

  async onClickPictureInPicture() {
    this.mediaElement.nativeElement.togglePictureInPicture();
  }

  onAudioloadedmetadata(event: Event) {
    console.log('audio metadata loaded', event);

    /**
     * pipe current time to mediaservice observable
     */
    merge(
      fromEvent(this.audio, 'timeupdate').pipe(
        map((o) => (o.target as HTMLMediaElement).currentTime)
      ),
      fromEvent(this.audio, 'seeking').pipe(
        map((o) => (o.target as HTMLMediaElement).currentTime)
      ),
      //TODO: Maybe start stop interval on media.playing and media.pause
      interval(0, animationFrameScheduler).pipe(
        filter(() => !this.audio.paused),
        map(() => this.audio.currentTime)
      )
    )
      .pipe(takeUntil(this.destroy$$), distinctUntilChanged())
      .subscribe((seconds) => {
        this.currentTime$.next(seconds * 1000);
      });

    // connect ot state
    this.store
      .select(editorSelectors.eIsPlayingMedia)
      .pipe(
        takeUntil(this.destroy$$),
        tap((isPlaying) => {
          if (isPlaying && this.audio.paused) {
            this.audio.play();
          } else if (!isPlaying && !this.audio.paused) {
            this.audio.pause();
          }
        })
      )
      .subscribe();

    this.mediaService.seeking$
      .pipe(
        takeUntil(this.destroy$$),
        tap((seekTo: number) => this.seekToTime(seekTo))
      )
      .subscribe();

    this.mediaService.initAudioElement(event, this.audioRef.nativeElement);
  }

  public seekToTime(milliseconds: number) {
    this.audio.currentTime = Number((milliseconds / 1000).toFixed(6));
  }
}
