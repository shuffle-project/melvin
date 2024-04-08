import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  debounceTime,
  fromEvent,
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

  public currentTime$ = new BehaviorSubject<number>(0);

  public play$ = new Subject<void>();
  public pause$ = new Subject<void>();

  public seeking$ = new Subject<number>();

  private captions$ = this.store.select(viewerSelector.vCaptions);

  public currentCaption$: BehaviorSubject<null | undefined | CaptionEntity> =
    new BehaviorSubject<CaptionEntity | undefined | null>(null);

  private _loadingData: string[] = [];
  public get loadingData() {
    return this._loadingData.length > 0;
  }

  constructor(
    private store: Store<AppState>,
    private storageService: StorageService
  ) {}

  resetService() {
    this.currentTime$.next(0);
    this.currentCaption$.next(null);
    this.audio = null;
    this.audioLoaded = false;
    this.projectId = null;

    this.destroy$$.next();
  }

  initAudioObservables(audioElement: HTMLAudioElement, projectId: string) {
    this.projectId = projectId;
    this.audio = audioElement;

    this.loadCurrentTimeFromStorage();

    // current time
    fromEvent(audioElement, 'timeupdate')
      .pipe(
        takeUntil(this.destroy$$),
        map((o) => (o.target as HTMLMediaElement).currentTime),
        tap((x) => this.currentTime$.next(x))
      )
      .subscribe();

    // play
    merge(fromEvent(audioElement, 'play'), fromEvent(audioElement, 'playing'))
      .pipe(
        takeUntil(this.destroy$$),
        tap(() => this.play$.next())
      )
      .subscribe();

    // pause

    merge(fromEvent(audioElement, 'pause'), fromEvent(audioElement, 'waiting'))
      .pipe(
        takeUntil(this.destroy$$),
        tap(() => this.pause$.next())
      )
      .subscribe();

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

    this.saveCurrentTimeInStorage();
    this.audioLoaded = true;
  }

  isLoading(id: string) {
    const indexOf = this._loadingData.indexOf(id);
    if (indexOf < 0) this._loadingData.push(id);
  }

  doneLoading(id: string) {
    const indexOf = this._loadingData.indexOf(id);
    if (indexOf > -1) this._loadingData.splice(indexOf, 1);
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
