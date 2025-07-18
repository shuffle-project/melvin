import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  fromEvent,
  merge,
  of,
  Subject,
  Subscription,
  switchMap,
  tap,
} from 'rxjs';
import { VideoEntity } from 'src/app/services/api/entities/project.entity';
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

  public isReady$ = new BehaviorSubject<boolean>(false);
  public duration$ = new BehaviorSubject<number>(0);
  public currentTime$ = new BehaviorSubject<number>(0);
  public currentCaption$ = new BehaviorSubject<
    CaptionEntity | undefined | null
  >(null);
  public jumpToCaptionTime$ = new BehaviorSubject<number | null>(null);
  public captionCreated$ = new Subject<CaptionEntity>();

  public seeking$ = new Subject<number>();

  loadingEvents: { id: string; subscription: Subscription }[] = [];

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

  registerMediaEvents(media: HTMLMediaElement, id: string) {
    this.store.dispatch(editorActions.eMediaLodingSingle({ id }));
    const subscription = merge(
      fromEvent(media, 'canplay'),
      fromEvent(media, 'canplaythrough'),
      fromEvent(media, 'waiting'),
      fromEvent(media, 'seeking'),
      fromEvent(media, 'seeked'),
      fromEvent(media, 'stalled'),
      fromEvent(media, 'suspended')
    )
      .pipe(
        // HAVE_NOTHING	0	No information is available about the media resource.
        // HAVE_METADATA	1	Enough of the media resource has been retrieved that the metadata attributes are initialized. Seeking will no longer raise an exception.
        // HAVE_CURRENT_DATA	2	Data is available for the current playback position, but not enough to actually play more than one frame.
        // HAVE_FUTURE_DATA	3	Data for the current playback position as well as for at least a little bit of time into the future is available (in other words, at least two frames of video, for example).
        // HAVE_ENOUGH_DATA	4	Enough data is available—and the download rate is high enough—that the media can be
        switchMap(() => of(media.readyState > 3)),
        distinctUntilChanged(),
        tap((isReady) => {
          if (isReady) {
            this.store.dispatch(editorActions.eMediaLoaded({ id }));
          } else {
            this.store.dispatch(editorActions.eMediaLodingSingle({ id }));
          }
        })
      )
      .subscribe();

    this.seekToTime(this.currentTime$.value, false);
    this.loadingEvents.push({ id, subscription });
  }

  initAudioElement(event: Event, audio: HTMLAudioElement) {
    this.registerMediaEvents(audio, 'audio');
    this.isReady$.next(true);
  }

  initMediaElement(
    media: VideoPlayerMediaElementComponent,
    playingVideo: VideoEntity
  ) {
    // this.destroyMediaElement();
    this.registerMediaEvents(media.video, playingVideo.id);
  }

  destroyMediaElement() {
    this.destroy$$.next();
    // this.isReady$.next(false);
    this.duration$.next(0);
    this.currentTime$.next(0);
    this.jumpToCaptionTime$.next(null);
  }

  skipForward(ms: number): void {
    this.seekToTime(this.currentTime$.getValue() + ms, true);
  }

  skipBackward(ms: number): void {
    this.seekToTime(this.currentTime$.getValue() - ms, true);
  }

  seekToTime(milliseconds: number, jumpToNearestCaption: boolean): void {
    // this.media?.seekToTime(milliseconds);
    this.seeking$.next(milliseconds);
    if (jumpToNearestCaption) {
      this.jumpToCaptionTime$.next(milliseconds);
      const seconds = Math.round(milliseconds / 1000);
      const foundElement = document.getElementsByClassName(`time-${seconds}`);
      if (foundElement && foundElement[0])
        foundElement[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
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
