import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PushPipe } from '@ngrx/component';
import { Subject, takeUntil, tap, throttleTime } from 'rxjs';
import { MediaCategoryPipe } from 'src/app/pipes/media-category-pipe/media-category.pipe';
import * as viewerActions from '../../../../../store/actions/viewer.actions';
import { AppState } from '../../../../../store/app.state';
import * as viewerSelector from '../../../../../store/selectors/viewer.selector';
import { ViewerService } from '../../../services/viewer.service';
import { ViewerVideo } from '../player.component';

@Component({
  selector: 'app-video-container',
  templateUrl: './video-container.component.html',
  styleUrls: ['./video-container.component.scss'],
  standalone: true,
  imports: [MatIconModule, MatButtonModule, PushPipe, MediaCategoryPipe],
})
export class VideoContainerComponent implements OnDestroy, OnChanges {
  private destroy$$ = new Subject<void>();

  @ViewChild('viewerVideo')
  private _viewerVideoElementRef!: ElementRef<HTMLVideoElement>;
  public get viewerVideoElement(): HTMLVideoElement {
    return this._viewerVideoElementRef.nativeElement;
  }

  @Input({ required: true })
  size!: 'big' | 'small';
  @Input({ required: true }) video!: ViewerVideo;

  public currentSpeed$ = this.store.select(viewerSelector.vCurrentSpeed);

  constructor(
    private store: Store<AppState>,
    public viewerService: ViewerService
  ) {}

  ngOnDestroy(): void {
    this.destroy$$.next();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['video'] && !changes['video'].isFirstChange()) {
      this.destroy$$.next();

      this.viewerVideoElement.load();
    }
  }

  onChangeMainVideo() {
    this.store.dispatch(
      viewerActions.switchToNewBigVideo({ newBigVideoId: this.video.id })
    );
  }

  onClickVideo() {
    if (this.size === 'big' && this.viewerService.audio) {
      this.store.dispatch(viewerActions.playPauseUser());
      // if (this.viewerService.audio.paused) {
      //   this.viewerService.play();
      // } else {
      //   this.viewerService.pause();
      // }
    }
  }

  onDblClickVideo() {
    if (this.size === 'big') {
      this.viewerService.onRequestFullscreen();
    }
  }

  onKeyDownVideo(event: KeyboardEvent) {
    if (this.size === 'big' && this.viewerService.audio) {
      switch (event.key) {
        case ' ':
          this.store.dispatch(viewerActions.playPauseUser());
          // if (this.viewerService.audio.paused) {
          //   this.viewerService.play();
          // } else {
          //   this.viewerService.pause();
          // }
          break;
        // case 'ArrowRight':
        //   if (
        //     this.viewerService.audio.currentTime + 3000 <
        //     this.viewerService.audio.duration
        //   )
        //     this.viewerService.audio.currentTime += 3000;
        //   break;
        // case 'ArrowLeft':
        //   if (this.viewerService.audio.currentTime - 3000 > 0)
        //     this.viewerService.audio.currentTime -= 3000;

        //   break;
        // case 'ArrowUp':
        //   if (this.viewerService.audio.volume < 1)
        //     this.viewerService.audio.volume += 0.1;
        //   break;
        // case 'ArrowDown':
        //   if (this.viewerService.audio.volume > 0)
        //     this.viewerService.audio.volume -= 0.1;
        //   break;
      }
    }
  }

  onVideoLoadMetadata(event: Event) {
    this.connectToState(event);

    this.viewerService.registerLoadingEvents(
      this.video.id,
      this.viewerVideoElement,
      this.destroy$$
    );
  }

  connectToState(event: Event) {
    this.store
      .select(viewerSelector.vIsPlayingMedia)
      .pipe(
        takeUntil(this.destroy$$),
        tap((isPlaying) => {
          if (this.viewerService.audio) {
            const audioTime = this.viewerService.audio.currentTime;
            const videoTime = this.viewerVideoElement.currentTime;

            this._resyncIfNeeded(audioTime, videoTime);
          }

          if (isPlaying) {
            this.viewerVideoElement.play();
          } else {
            this.viewerVideoElement.pause();
          }
        })
      )
      .subscribe();

    this.viewerService.seeking$
      .pipe(
        takeUntil(this.destroy$$),
        tap((seekTo: number) => (this.viewerVideoElement.currentTime = seekTo))
      )
      .subscribe();

    // sync to audio
    this.viewerService.currentTime$
      .pipe(
        takeUntil(this.destroy$$),
        throttleTime(2000),
        tap((audioCurrentTime: number) => {
          // return if viewerVideo duration is already reached

          const audioTime = audioCurrentTime;
          const videoTime = this.viewerVideoElement.currentTime;

          this._resyncIfNeeded(audioTime, videoTime);
        })
      )
      .subscribe();
  }

  private _resyncIfNeeded(audioTime: number, videoTime: number) {
    if (this.viewerVideoElement.duration < audioTime) return;

    const audioOffsetMS = (audioTime - videoTime) * 1000;

    /**
     * https://en.wikipedia.org/wiki/Audio-to-video_synchronization#:~:text=The%20EBU%20Recommendation%20R37%20%22The,5%20ms%20and%20%2D15%20ms.
     * The EBU Recommendation R37 "The relative timing of the sound and vision components of a television signal"
     * states that end-to-end audio/video sync should be within +40 ms and -60 ms (audio before/after video, respectively)
     *  and that each stage should be within +5 ms and -15 ms.
     *
     * ATSC IS-191: -45ms to 15ms
     * EBU R37-2007: -60ms to 40ms
     * ITU BT.1359-1: -125ms to 45ms
     * ITU BR.265-9: -22ms to 22ms
     */
    const msBefore = 100;
    const msAfter = -100;

    if (audioOffsetMS > msBefore || audioOffsetMS < msAfter) {
      this.viewerVideoElement.currentTime = audioTime;
    }
  }
}
