import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PushPipe } from '@ngrx/component';
import { Subject, fromEvent, merge, takeUntil, tap, throttleTime } from 'rxjs';
import { switchToNewBigVideo } from '../../../../../store/actions/viewer.actions';
import { AppState } from '../../../../../store/app.state';
import * as viewerSelector from '../../../../../store/selectors/viewer.selector';
import { ViewerService } from '../../../services/viewer.service';
import { ViewerVideo } from '../player.component';

@Component({
  selector: 'app-video-container',
  templateUrl: './video-container.component.html',
  styleUrls: ['./video-container.component.scss'],
  standalone: true,
  imports: [MatIconModule, MatButtonModule, PushPipe],
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

  @Output() public videoMetadataLoaded = new EventEmitter<void>();

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
    this.store.dispatch(switchToNewBigVideo({ newBigVideoId: this.video.id }));
  }

  onClickVideo() {
    if (this.size === 'big' && this.viewerService.audio) {
      if (this.viewerService.audio.paused) {
        this.viewerService.audio.play();
      } else {
        this.viewerService.audio.pause();
      }
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
          if (this.viewerService.audio.paused) {
            this.viewerService.audio.play();
          } else {
            this.viewerService.audio.pause();
          }
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
    this.connectToAudio(event);

    fromEvent(this.viewerVideoElement, 'canplay')
      .pipe(
        takeUntil(this.destroy$$),
        tap(() => {
          this.viewerService.doneLoading(this.video.id);
        })
      )
      .subscribe();

    merge(
      fromEvent(this.viewerVideoElement, 'waiting'),
      fromEvent(this.viewerVideoElement, 'seeking'),
      fromEvent(this.viewerVideoElement, 'seeked'),
      fromEvent(this.viewerVideoElement, 'stalled'),
      fromEvent(this.viewerVideoElement, 'suspended')
    )
      .pipe(
        takeUntil(this.destroy$$),
        tap(() => {
          this.viewerService.isLoading(this.video.id);
        })
      )
      .subscribe();

    this.videoMetadataLoaded.emit();
  }

  connectToAudio(event: Event) {
    // current state
    this.setCurrentState(this.viewerVideoElement);

    // future state
    this.viewerService.play$
      .pipe(
        takeUntil(this.destroy$$),
        tap(() => this.viewerVideoElement.play())
      )
      .subscribe();

    this.viewerService.pause$
      .pipe(
        takeUntil(this.destroy$$),
        tap(() => {
          this.viewerVideoElement.pause();
          if (this.viewerService.audio)
            this.viewerVideoElement.currentTime =
              this.viewerService.audio.currentTime;
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
        throttleTime(5000),
        tap((audioCurrentTime: number) => {
          // return if viewerVideo duration is already reached
          if (this.viewerVideoElement.duration < audioCurrentTime) return;

          const audioTime = audioCurrentTime;
          const videoTime = this.viewerVideoElement.currentTime;
          const audioToVideoMS = (audioTime - videoTime) * 1000;

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

          const msBefore = 40;
          const msAfter = -60;
          if (audioToVideoMS < msBefore || audioToVideoMS > msAfter) return;
          console.log('resync video ', audioToVideoMS);

          // TODO seek if too far off
          if (audioToVideoMS > 0) {
            // audio ist x millisekunden VOR video, video müsste vorgespult werden
          } else {
            // audio ist x millisekunden HINTER video, video müsste zurückgespult werden
          }

          // TODO older, only resets if too far off
          // this.viewerVideoElement.currentTime = audioCurrentTime;
          this.viewerVideoElement.fastSeek(audioCurrentTime);
        })
      )
      .subscribe();
  }

  private setCurrentState(videoPlayer: HTMLVideoElement) {
    videoPlayer.readyState;
    if (this.viewerService.audio) {
      videoPlayer.currentTime = this.viewerService.audio.currentTime;

      if (!this.viewerService.audio.paused) {
        videoPlayer.play();
      }
    }
  }
}
