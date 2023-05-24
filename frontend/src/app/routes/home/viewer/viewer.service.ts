import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  fromEvent,
  map,
  takeUntil,
  tap,
} from 'rxjs';
import { CaptionEntity } from '../../../services/api/entities/caption.entity';
import { AppState } from '../../../store/app.state';
import * as captionsSelector from '../../../store/selectors/captions.selector';

@Injectable({
  providedIn: 'root',
})
export class ViewerService {
  private destroy$$ = new Subject<void>();

  private videoElement: HTMLVideoElement | null = null;

  public currentTime$ = new BehaviorSubject<number>(0);

  private captions$ = this.store.select(captionsSelector.selectCaptions);

  public currentCaption$: BehaviorSubject<null | undefined | CaptionEntity> =
    new BehaviorSubject<CaptionEntity | undefined | null>(null);

  constructor(private store: Store<AppState>) {}

  resetService() {
    this.currentTime$.next(0);
    this.currentCaption$.next(null);
    this.videoElement = null;

    this.destroy$$.next();
  }

  initObservables(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;

    // current time
    fromEvent(videoElement, 'timeupdate')
      .pipe(
        takeUntil(this.destroy$$),
        map((o) => (o.target as HTMLMediaElement).currentTime),
        tap((x) => this.currentTime$.next(x * 1000))
      )
      .subscribe();

    // current caption
    combineLatest([this.captions$, this.currentTime$])
      .pipe(
        tap(([captions, currentTime]) => {
          const caption =
            captions.find(
              (caption) =>
                currentTime >= caption.start && currentTime <= caption.end
            ) || null;

          this.currentCaption$.next(caption);
        })
      )
      .subscribe();
  }

  onJumpInVideo(newSeconds: number) {
    if (this.videoElement) {
      this.videoElement.currentTime = newSeconds;
    }
  }

  // on debounce save currentTime in local storage
}
