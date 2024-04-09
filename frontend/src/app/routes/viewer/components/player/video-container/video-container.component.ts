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
import { Subject, fromEvent, merge, takeUntil, tap } from 'rxjs';
import { switchToNewBigVideo } from '../../../../../store/actions/viewer.actions';
import { AppState } from '../../../../../store/app.state';
import * as viewerSelector from '../../../../../store/selectors/viewer.selector';
import { ViewerService } from '../../../../viewer/viewer.service';
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
        tap(() => this.viewerVideoElement.pause())
      )
      .subscribe();

    this.viewerService.seeking$
      .pipe(
        takeUntil(this.destroy$$),
        tap((seekTo: number) => (this.viewerVideoElement.currentTime = seekTo))
      )
      .subscribe();
  }

  private setCurrentState(videoPlayer: HTMLVideoElement) {
    if (this.viewerService.audio) {
      videoPlayer.currentTime = this.viewerService.audio.currentTime;
      if (!this.viewerService.audio.paused) {
        videoPlayer.play();
      }
    }
  }
}
