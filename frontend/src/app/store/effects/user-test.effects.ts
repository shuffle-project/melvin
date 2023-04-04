import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, tap, withLatestFrom } from 'rxjs';
import { MediaService } from '../../routes/home/editor/services/media/media.service';
import { AppService } from '../../services/app/app.service';
import { AppState } from '../app.state';
import * as editorSelectors from '../selectors/editor.selector';
import * as userTestActions from './../actions/user-test.actions';

@Injectable()
export class UserTestEffects {
  private timeOffset = 1000;

  constructor(
    private actions$: Actions,
    private mediaService: MediaService,
    private store: Store<AppState>,
    private appService: AppService
  ) {}

  start$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(userTestActions.playFromWS),
        tap(() => {
          console.log('seekTo', this.timeOffset);
          this.mediaService.seekToTime(this.timeOffset, false);
          this.store.dispatch(userTestActions.resumeFromUserTestEffect());
        })
      ),
    { dispatch: false }
  );

  updateCurrentTime$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(userTestActions.updateCurrentTimeFromWS),
        withLatestFrom(this.store.select(editorSelectors.selectIsPlaying)),
        filter(
          ([action, isPlaying]) =>
            !isPlaying && this.appService.hasUserInteractedWithDOM
        ),
        tap(([action]) => {
          console.log('seekTo', action.currentTime + this.timeOffset);
          this.mediaService.seekToTime(
            action.currentTime + this.timeOffset,
            true
          );
          this.store.dispatch(userTestActions.resumeFromUserTestEffect());
        })
      ),
    { dispatch: false }
  );
}
