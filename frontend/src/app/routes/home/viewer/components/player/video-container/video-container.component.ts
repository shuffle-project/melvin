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

import { Subject, takeUntil, tap } from 'rxjs';
import { AppState } from '../../../../../../store/app.state';
import * as editorSelector from '../../../../../../store/selectors/editor.selector';
import { ViewerService } from '../../../viewer.service';
import { ViewerVideo } from '../player.component';

@Component({
  selector: 'app-video-container',
  templateUrl: './video-container.component.html',
  styleUrls: ['./video-container.component.scss'],
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
  @Output() public switchToBig = new EventEmitter<void>();

  public currentSpeed$ = this.store.select(editorSelector.selectCurrentSpeed);

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
    this.switchToBig.emit();
  }

  onVideoLoadMetadata(event: Event) {
    this.connectToAudio(event);

    this.video.isReady = true;

    // TODO ready state aller videos
    // fromEvent(this.viewerVideoElement, 'canplay')
    //   .pipe(
    //     takeUntil(this.destroy$$),
    //     tap(() => {
    //       this.video.isReady = true;
    //     })
    //   )
    //   .subscribe();

    // merge(
    //   fromEvent(this.viewerVideoElement, 'waiting'),
    //   fromEvent(this.viewerVideoElement, 'seeking'),
    //   fromEvent(this.viewerVideoElement, 'seeked'),
    //   fromEvent(this.viewerVideoElement, 'stalled'),
    //   fromEvent(this.viewerVideoElement, 'suspended')
    // )
    //   .pipe(
    //     takeUntil(this.destroy$$),
    //     tap(() => {
    //       this.video.isReady = false;
    //     })
    //   )
    //   .subscribe();

    this.videoMetadataLoaded.emit();
  }

  connectToAudio(event: Event) {
    const videoPlayer = this.viewerVideoElement;

    // current state
    this.setCurrentState(videoPlayer);

    // future state
    this.viewerService.play$
      .pipe(
        takeUntil(this.destroy$$),
        tap(() => videoPlayer.play())
      )
      .subscribe();

    this.viewerService.pause$
      .pipe(
        takeUntil(this.destroy$$),
        tap(() => videoPlayer.pause())
      )
      .subscribe();

    this.viewerService.seeking$
      .pipe(
        takeUntil(this.destroy$$),
        tap((seekTo: number) => (videoPlayer.currentTime = seekTo))
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
