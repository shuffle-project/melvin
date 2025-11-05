import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  BehaviorSubject,
  Subject,
  debounceTime,
  fromEvent,
  takeUntil,
  tap,
  throttleTime,
  withLatestFrom,
} from 'rxjs';
import { AppState } from '../../../store/app.state';
import { vIsPlayingUser } from '../../../store/selectors/viewer.selector';
import { ViewerService } from './viewer.service';

@Injectable({
  providedIn: 'root',
})
export class OverlayService implements OnDestroy {
  private destroy$$ = new Subject<void>();

  private _hideAfterMS = 2500;

  public showOverlay = true;

  public menuOpen$ = new BehaviorSubject<boolean>(false);

  private _mousemove$ = fromEvent(document, 'mousemove');
  private _keydown$ = fromEvent(document, 'keydown');

  private _hideWithDelay$ = new Subject<boolean>();

  constructor(
    private viewerService: ViewerService,
    private store: Store<AppState>
  ) {}

  ngOnDestroy(): void {
    this.destroy();
  }

  public destroy() {
    this.destroy$$.next();
  }

  public init() {
    // hide overlay after delay
    this._hideWithDelay$
      .pipe(
        takeUntil(this.destroy$$),
        debounceTime(this._hideAfterMS),
        tap((hide) => {
          if (hide) {
            this.showOverlay = false;
          }
        })
      )
      .subscribe();

    // hide on playing / show on paused
    this.store
      .select(vIsPlayingUser)
      .pipe(
        takeUntil(this.destroy$$),
        withLatestFrom(this.menuOpen$),
        tap(([isPlaying, isMenuOpen]) => {
          this._showOrHide(isPlaying, isMenuOpen);
        })
      )
      .subscribe();

    // show on mousemove, if playing
    this._mousemove$
      .pipe(
        takeUntil(this.destroy$$),
        withLatestFrom(this.store.select(vIsPlayingUser), this.menuOpen$),
        throttleTime(1000),
        tap(([_, isPlaying, menuOpen]) => {
          this._showOrHide(isPlaying, menuOpen);
        })
      )
      .subscribe();

    // show on keydown, if playing
    this._keydown$
      .pipe(
        takeUntil(this.destroy$$),
        withLatestFrom(this.store.select(vIsPlayingUser), this.menuOpen$),
        tap(([_, isPlaying, isMenuOpen]) => {
          this._showOrHide(isPlaying, isMenuOpen);
        })
      )
      .subscribe();

    // hide on menu open
    this.menuOpen$
      .pipe(
        takeUntil(this.destroy$$),
        withLatestFrom(this.store.select(vIsPlayingUser)),
        tap(([isMenuOpen, isPlaying]) => {
          this._showOrHide(isPlaying, isMenuOpen);
        })
      )
      .subscribe();
  }

  private _showOrHide(isPlaying: boolean, isMenuOpen: boolean) {
    if (isMenuOpen) {
      this._show();
    } else if (isPlaying) {
      this._hide();
    } else {
      this._show();
    }
  }

  private _show() {
    this.showOverlay = true;
    this._hideWithDelay$.next(false);
  }

  private _hide() {
    this.showOverlay = true;
    this._hideWithDelay$.next(true);
  }
}
