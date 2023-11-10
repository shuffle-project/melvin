import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, Subject, takeUntil, tap } from 'rxjs';
import { CaptionEntity } from '../../../../../services/api/entities/caption.entity';
import * as editorActions from '../../../../../store/actions/editor.actions';
import * as captionsSelectors from '../../../../../store/selectors/captions.selector';
import * as editorSelectors from '../../../../../store/selectors/editor.selector';
import { VideoPlayerMediaElementComponent } from '../../components/video-player/video-player-media-element/video-player-media-element.component';

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private destroy$$ = new Subject<void>();
  private media!: VideoPlayerMediaElementComponent | null;

  public isReady$ = new BehaviorSubject<boolean>(false);
  public duration$ = new BehaviorSubject<number>(0);
  public currentTime$ = new BehaviorSubject<number>(0);
  public currentCaption$ = new BehaviorSubject<
    CaptionEntity | undefined | null
  >(null);
  public jumpToCaptionTime$ = new BehaviorSubject<number | null>(null);
  public captionCreated$ = new Subject<CaptionEntity>();

  constructor(private store: Store) {
    // Project duration
    combineLatest([
      this.isReady$,
      this.store.select(editorSelectors.selectDuration),
    ])
      .pipe(
        tap(([isReady, duration]) =>
          this.duration$.next(isReady ? duration : 0)
        )
      )
      .subscribe();

    // Current caption
    combineLatest([
      this.isReady$,
      this.currentTime$,
      this.store.select(captionsSelectors.selectCaptions),
    ])
      .pipe(
        tap(([isReady, currentTime, captions]) => {
          const caption = isReady
            ? captions.find(
                (caption) =>
                  currentTime >= caption.start && currentTime <= caption.end
              )
            : null;
          this.currentCaption$.next(caption);
        })
      )
      .subscribe();
  }

  initMediaElement(media: VideoPlayerMediaElementComponent) {
    this.destroyMediaElement();

    this.media = media;

    // Subscribe to currentTime
    media.currentTime$
      .pipe(
        takeUntil(this.destroy$$),
        tap((currentTime) => this.currentTime$.next(currentTime))
      )
      .subscribe();

    this.isReady$.next(true);
  }

  destroyMediaElement() {
    this.destroy$$.next();
    this.isReady$.next(false);
    this.duration$.next(0);
    this.currentTime$.next(0);
    this.media = null;
    this.jumpToCaptionTime$.next(null);
  }

  skipForward(ms: number): void {
    this.seekToTime(this.currentTime$.getValue() + ms, true);
  }

  skipBackward(ms: number): void {
    this.seekToTime(this.currentTime$.getValue() - ms, true);
  }

  seekToTime(milliseconds: number, jumpToNearestCaption: boolean): void {
    this.media?.seekToTime(milliseconds);
    if (jumpToNearestCaption) {
      this.jumpToCaptionTime$.next(milliseconds);
    }
  }

  loop(start: number, end: number) {
    // TODO: Real endless loop logic
    this.store.dispatch(editorActions.playFromMediaService());
    this.seekToTime(start, false);
    setTimeout(() => {
      this.seekToTime(start, false);
    }, (end - start) * 1000);
  }
}
