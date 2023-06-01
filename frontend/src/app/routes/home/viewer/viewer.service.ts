import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  debounceTime,
  fromEvent,
  map,
  takeUntil,
  tap,
} from 'rxjs';
import { CaptionEntity } from '../../../services/api/entities/caption.entity';
import { StorageKey } from '../../../services/storage/storage-key.enum';
import { StorageService } from '../../../services/storage/storage.service';
import { AppState } from '../../../store/app.state';
import * as captionsSelector from '../../../store/selectors/captions.selector';

@Injectable({
  providedIn: 'root',
})
export class ViewerService {
  private destroy$$ = new Subject<void>();

  private projectId: string | null = null;
  private videoElement: HTMLVideoElement | null = null;

  public currentTime$ = new BehaviorSubject<number>(0);

  private captions$ = this.store.select(captionsSelector.selectCaptions);

  public currentCaption$: BehaviorSubject<null | undefined | CaptionEntity> =
    new BehaviorSubject<CaptionEntity | undefined | null>(null);

  constructor(
    private route: ActivatedRoute,
    private store: Store<AppState>,
    private storageService: StorageService
  ) {}

  resetService() {
    this.currentTime$.next(0);
    this.currentCaption$.next(null);
    this.videoElement = null;
    this.projectId = null;

    this.destroy$$.next();
  }

  initObservables(videoElement: HTMLVideoElement, projectId: string) {
    this.videoElement = videoElement;
    this.projectId = projectId;

    this.loadCurrentTime();

    // current time
    fromEvent(videoElement, 'timeupdate')
      .pipe(
        takeUntil(this.destroy$$),
        map((o) => (o.target as HTMLMediaElement).currentTime),
        tap((x) => this.currentTime$.next(x))
      )
      .subscribe();

    // current caption
    combineLatest([this.captions$, this.currentTime$])
      .pipe(
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

    this.saveCurrentTime();
  }

  onJumpInVideo(newSeconds: number) {
    if (this.videoElement) {
      this.videoElement.currentTime = newSeconds / 1000;
    }
  }

  loadCurrentTime() {
    let storageObj = this.storageService.getFromLocalStorage(
      StorageKey.CURRENT_TIME_ARRAY
    ) as any;
    if (storageObj && this.projectId!) {
      const number = storageObj[this.projectId!];

      if (number && this.videoElement) {
        this.videoElement.currentTime = number;
      }
    }
  }

  saveCurrentTime() {
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
}
