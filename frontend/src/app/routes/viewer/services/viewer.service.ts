import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  BehaviorSubject,
  Observable,
  Subject,
  animationFrameScheduler,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  fromEvent,
  interval,
  map,
  merge,
  takeUntil,
  tap,
} from 'rxjs';
import { CaptionEntity } from '../../../services/api/entities/caption.entity';
import { StorageKey } from '../../../services/storage/storage-key.enum';
import { StorageService } from '../../../services/storage/storage.service';
import * as viewerActions from '../../../store/actions/viewer.actions';
import { AppState } from '../../../store/app.state';
import * as viewerSelector from '../../../store/selectors/viewer.selector';

@Injectable({
  providedIn: 'root',
})
export class ViewerService {
  private destroy$$ = new Subject<void>();

  private projectId: string | null = null;

  public audio: HTMLAudioElement | null = null;
  public audioLoaded: boolean = false;

  public currentTime$ = new Observable<number>();

  // public play$ = new Subject<void>();
  // public pause$ = new Subject<void>();

  // public isPlaying$ = new BehaviorSubject<boolean>(false);

  public seeking$ = new Subject<number>();

  private captions$ = this.store.select(viewerSelector.vCaptions);

  public currentCaption$: BehaviorSubject<null | undefined | CaptionEntity> =
    new BehaviorSubject<CaptionEntity | undefined | null>(null);

  // TODO new
  public isPlayingUser$ = this.store.select(viewerSelector.vIsPlayingUser);
  public isPlayingMedia$ = this.store.select(viewerSelector.vIsPlayingMedia);

  constructor(
    private store: Store<AppState>,
    private storageService: StorageService
  ) {}

  resetService() {
    this.currentCaption$.next(null);
    this.audio = null;
    this.audioLoaded = false;
    this.projectId = null;

    this.destroy$$.next();
  }

  // play() {
  //   console.log('play', this.audio?.paused);
  //   if (this.audio) {
  //     // TODO
  //     /**
  //      * media loading checken?
  //      */
  //     // console.log(this.mediaLoading);
  //     this.audio.pause();
  //     // if (this.mediaLoading) {
  //     //   console.log('settimeout');
  //     //   setTimeout(() => {
  //     //     this.play();
  //     //   }, 250);
  //     // } else {
  //     //   console.log('actually play');
  //     //   this.audio.play();
  //     // }
  //   }
  // }

  // pause() {
  //   console.log('pause');
  //   if (this.audio) {
  //     this.audio.pause();
  //   }
  // }

  initAudioObservables(audioElement: HTMLAudioElement, projectId: string) {
    this.projectId = projectId;
    this.audio = audioElement;

    // TODO take until destory
    this.loadCurrentTimeFromStorage();
    // this.isPlayingUser$.subscribe
    // this.play$.subscribe(() => this.isPlaying$.next(true));
    // this.pause$.subscribe(() => this.isPlaying$.next(false));

    this.isPlayingMedia$
      .pipe(
        takeUntil(this.destroy$$),
        tap((isPlaying) => {
          if (isPlaying) {
            this.audio?.play();
          } else {
            this.audio?.pause();
          }
        })
      )
      .subscribe();

    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement#events
    this.currentTime$ = merge(
      fromEvent(audioElement, 'timeupdate').pipe(
        map((o) => (o.target as HTMLMediaElement).currentTime)
      ),
      fromEvent(audioElement, 'seeking').pipe(
        map((o) => (o.target as HTMLMediaElement).currentTime)
      ),
      //TODO: Maybe start stop interval on media.playing and media.pause
      interval(0, animationFrameScheduler).pipe(
        filter(() => !audioElement.paused),
        map(() => audioElement.currentTime)
      )
    ).pipe(takeUntil(this.destroy$$), distinctUntilChanged());

    // play
    // merge(fromEvent(audioElement, 'play'), fromEvent(audioElement, 'playing'))
    //   .pipe(
    //     takeUntil(this.destroy$$),
    //     tap(() => this.play$.next())
    //   )
    //   .subscribe();

    // pause
    // merge(fromEvent(audioElement, 'pause'), fromEvent(audioElement, 'waiting'))
    //   .pipe(
    //     takeUntil(this.destroy$$),
    //     tap(() => this.pause$.next())
    //   )
    //   .subscribe();

    // seeking
    merge(fromEvent(audioElement, 'seeking'), fromEvent(audioElement, 'seeked'))
      .pipe(
        takeUntil(this.destroy$$),
        map((e: Event) => (e.target as HTMLAudioElement).currentTime),
        tap((seekingTo: number) => this.seeking$.next(seekingTo))
      )
      .subscribe();

    // current caption
    combineLatest([this.captions$, this.currentTime$])
      .pipe(
        takeUntil(this.destroy$$),
        tap(([captions, currentTime]) => {
          currentTime = currentTime * 1000;
          const caption =
            captions.find(
              (caption) =>
                currentTime >= caption.start && currentTime <= caption.end
            ) || null;
          this.currentCaption$.next(caption);
        })
      )
      .subscribe();
    this.registerLoadingEvents('audio', audioElement, this.destroy$$);

    this.saveCurrentTimeInStorage();
    this.audioLoaded = true;
  }

  registerLoadingEvents(
    id: string,
    htmlMediaElement: HTMLMediaElement,
    takeUntil$: Subject<void>
  ) {
    merge(
      fromEvent(htmlMediaElement, 'canplay'),
      fromEvent(htmlMediaElement, 'waiting'),
      fromEvent(htmlMediaElement, 'seeking'),
      fromEvent(htmlMediaElement, 'seeked'),
      fromEvent(htmlMediaElement, 'stalled'),
      fromEvent(htmlMediaElement, 'suspended')
    )
      .pipe(
        takeUntil(takeUntil$),
        debounceTime(0),
        tap(() => {
          // HAVE_NOTHING	0	No information is available about the media resource.
          // HAVE_METADATA	1	Enough of the media resource has been retrieved that the metadata attributes are initialized. Seeking will no longer raise an exception.
          // HAVE_CURRENT_DATA	2	Data is available for the current playback position, but not enough to actually play more than one frame.
          // HAVE_FUTURE_DATA	3	Data for the current playback position as well as for at least a little bit of time into the future is available (in other words, at least two frames of video, for example).
          // HAVE_ENOUGH_DATA	4	Enough data is available—and the download rate is high enough—that the media can be

          if (htmlMediaElement.readyState > 2) {
            this.store.dispatch(viewerActions.mediaLoaded({ id }));
          } else {
            this.store.dispatch(viewerActions.mediaLoading({ id }));
          }

          // this.isLoading(id);
        })
      )
      .subscribe();
  }

  onJumpInAudio(newSeconds: number) {
    if (this.audio) {
      this.audio.currentTime = newSeconds / 1000;
    }
  }

  // store and save in local storage

  loadCurrentTimeFromStorage() {
    let storageObj = this.storageService.getFromLocalStorage(
      StorageKey.CURRENT_TIME_ARRAY
    ) as any;
    if (storageObj && this.projectId!) {
      const number = storageObj[this.projectId!];

      if (number && this.audio) {
        this.audio.currentTime = number;
      }
    }
  }

  saveCurrentTimeInStorage() {
    this.currentTime$
      .pipe(
        takeUntil(this.destroy$$),
        debounceTime(5000),
        tap((currentTime) => {
          let storageObj =
            (this.storageService.getFromLocalStorage(
              StorageKey.CURRENT_TIME_ARRAY
            ) as any) || {};
          storageObj[this.projectId!] = currentTime;
          this.storageService.storeInLocalStorage(
            StorageKey.CURRENT_TIME_ARRAY,
            storageObj
          );
        })
      )
      .subscribe();
  }

  /**
   *
   * FULLSCREEN
   *
   */

  isFullscreenActive() {
    return (
      document.fullscreenElement || (document as any).webkitFullscreenElement
    );
  }

  async onExitFullscreen() {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
    }
    // this.store.dispatch(viewerActions.showTranscript());
  }

  onRequestFullscreen() {
    if (this.isFullscreenActive()) {
      this.onExitFullscreen();
    } else {
      const doc = document.getElementsByTagName('body').item(0);
      if (doc) {
        this.store.dispatch(viewerActions.hideTranscript());

        // show transcript again on closing fullscreen
        doc.onfullscreenchange = () => {
          if (!this.isFullscreenActive()) {
            this.store.dispatch(viewerActions.showTranscript());
          }
        };

        if (doc.requestFullscreen) {
          doc.requestFullscreen();
        } else if ((doc as any).webkitRequestFullscreen) {
          (doc as any).webkitRequestFullscreen();
        }
      }
    }
  }
}
