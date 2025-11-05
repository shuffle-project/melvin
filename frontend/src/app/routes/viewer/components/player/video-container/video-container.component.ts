import {
  AfterViewInit,
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
import { debounceTime, fromEventPattern, Subject, takeUntil, tap } from 'rxjs';
import { MediaCategoryPipe } from 'src/app/pipes/media-category-pipe/media-category.pipe';
import {
  Resolution,
  ResolutionValue,
} from 'src/app/services/api/entities/project.entity';
import * as viewerActions from '../../../../../store/actions/viewer.actions';
import { AppState } from '../../../../../store/app.state';
import * as viewerSelector from '../../../../../store/selectors/viewer.selector';
import { ViewerService } from '../../../services/viewer.service';
import { ViewerVideo } from '../player.component';

@Component({
  selector: 'app-video-container',
  templateUrl: './video-container.component.html',
  styleUrls: ['./video-container.component.scss'],
  imports: [
    MatIconModule,
    MatButtonModule,
    PushPipe,
    MediaCategoryPipe,
    MediaCategoryPipe,
  ],
})
export class VideoContainerComponent
  implements OnDestroy, OnChanges, AfterViewInit
{
  private destroy$$ = new Subject<void>();

  @ViewChild('viewerVideo')
  private _viewerVideoElementRef!: ElementRef<HTMLVideoElement>;
  public get viewerVideoElement(): HTMLVideoElement {
    return this._viewerVideoElementRef.nativeElement;
  }

  @ViewChild('viewerVideoSrc') viewerVideoSrc!: ElementRef<HTMLSourceElement>;

  @Input({ required: true })
  size!: 'big' | 'small';
  @Input({ required: true }) video!: ViewerVideo;

  public currentSpeed$ = this.store.select(viewerSelector.vCurrentSpeed);

  // capped to the max resolution selected by the user
  private cappedResolutions: Resolution[] = [];
  private currentResolution!: Resolution;
  private videoWidth = 300;
  private maxResolution: ResolutionValue = '1080p';
  private immediateInputChange = false;

  constructor(
    private store: Store<AppState>,
    public viewerService: ViewerService
  ) {}

  ngAfterViewInit(): void {
    this.store
      .select(viewerSelector.vMaxResolution)
      .pipe(takeUntil(this.destroy$$))
      .subscribe((maxResolution) => {
        this.maxResolution = maxResolution;
        this._capResolutions();

        const fittingResolution = this._findFittingResolution();

        if (
          !this.currentResolution ||
          this.currentResolution.resolution !== fittingResolution.resolution
        ) {
          this._handleNewCurrentResolution(fittingResolution);
        }
      });

    this._observerResize(this.viewerVideoElement)
      .pipe(debounceTime(300), takeUntil(this.destroy$$))
      .subscribe((width) => {
        if (!width) return;
        if (this.immediateInputChange) {
          this.immediateInputChange = false;
          return;
        }

        const newWidth = +width!;
        if (newWidth !== this.videoWidth) {
          this.videoWidth = newWidth;
          const fittingResolution = this._findFittingResolution();
          if (
            !this.currentResolution ||
            this.currentResolution.resolution !== fittingResolution.resolution
          ) {
            this._handleNewCurrentResolution(fittingResolution);
          }
        }
      });
  }

  private _handleNewCurrentResolution(resolution: Resolution) {
    this.currentResolution = resolution;

    this.store.dispatch(
      viewerActions.mediaLoadingSingle({ id: this.video.id })
    );

    this.viewerVideoSrc.nativeElement.src = resolution.url;
    this.viewerVideoElement.load();
  }

  private _observerResize(element: HTMLElement) {
    return fromEventPattern(
      (handler) => {
        const observer = new ResizeObserver((entries) => {
          const width = entries[0].contentRect.width.toFixed();
          handler(width);
        });
        observer.observe(element);
        return observer;
      },
      (handler, observer) => observer.disconnect()
    );
  }

  private _findFittingResolution() {
    const aspectRatio =
      this.cappedResolutions[0].width / this.cappedResolutions[0].height;

    const videoContainerHeight = +(this.videoWidth / aspectRatio).toFixed();
    const videoContainerSize = videoContainerHeight * this.videoWidth;

    const calculateCappedResoultions = this.cappedResolutions.map(
      (res) => res.height * res.width
    );

    const closestFittingResolution = calculateCappedResoultions.reduce(
      (prev, curr) =>
        Math.abs(curr - videoContainerSize) <
        Math.abs(prev - videoContainerSize)
          ? curr
          : prev
    );

    const closestFittingResolutionIndex = calculateCappedResoultions.findIndex(
      (res) => res === closestFittingResolution
    );

    return this.cappedResolutions[closestFittingResolutionIndex];
  }

  private _capResolutions() {
    const sortedResolutions = [...this.video.resolutions].sort(
      (a, b) => a.width - b.width
    );

    let maxResolutionIndex = sortedResolutions.findIndex(
      (res) => res.resolution === this.maxResolution
    );

    if (maxResolutionIndex === -1) {
      maxResolutionIndex = sortedResolutions.length - 1;
    }

    this.cappedResolutions = sortedResolutions.slice(0, maxResolutionIndex + 1);
  }

  ngOnDestroy(): void {
    this.viewerService.unregisterLoadingEvents(this.video.id);
    this.destroy$$.next();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['video'] && !changes['video'].isFirstChange()) {
      if (
        changes['video'].previousValue.id !== changes['video'].currentValue.id
      ) {
        this.immediateInputChange = true;
        this._capResolutions();
        const fittingResolution = this._findFittingResolution();
        this._handleNewCurrentResolution(fittingResolution);
      }
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
          break;
      }
    }
  }

  onVideoLoadMetadata(event: Event) {
    this.connectToState(event);

    this.viewerService.registerLoadingEvents(
      this.video.id,
      this.viewerVideoElement
    );
  }

  connectToState(event: Event) {
    this.store
      .select(viewerSelector.vIsPlayingMedia)
      .pipe(
        takeUntil(this.destroy$$),
        tap(async (isPlaying) => {
          if (this.viewerService.audio) {
            const audioTime = this.viewerService.audio.currentTime;
            const videoTime = this.viewerVideoElement.currentTime;

            this._resyncIfNeeded(audioTime, videoTime);
          }

          if (isPlaying) {
            try {
              await this.viewerVideoElement.play();
            } catch (e) {
              // This is fine
              // Play fails because user changed video or resolution
            }
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
