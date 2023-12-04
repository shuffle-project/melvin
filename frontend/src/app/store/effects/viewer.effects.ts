import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap, withLatestFrom } from 'rxjs';
import { ApiService } from '../../services/api/api.service';
import { StorageKey } from '../../services/storage/storage-key.enum';
import { StorageService } from '../../services/storage/storage.service';
import * as viewerActions from '../actions/viewer.actions';
import { AppState } from '../app.state';
import * as viewerSelector from '../selectors/viewer.selector';

@Injectable({
  providedIn: 'root',
})
export class ViewerEffects {
  constructor(
    private actions$: Actions,
    private api: ApiService,
    private storageService: StorageService,
    private store: Store<AppState>
  ) {}

  changeTranscriptEnabled$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(viewerActions.changeTranscriptEnabled),
        tap((action) => {
          this.storageService.storeInLocalStorage(
            StorageKey.VIEWER_TRANSCRIPT_ENABLED,
            action.transcriptEnabled
          );
        })
      ),
    { dispatch: false }
  );

  toggleTranscriptEnabled$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(viewerActions.toggleTranscript),
        withLatestFrom(
          this.store.select(viewerSelector.selectTranscriptEnabled)
        ),
        tap(([action, transcriptEnabled]) => {
          this.storageService.storeInLocalStorage(
            StorageKey.VIEWER_TRANSCRIPT_ENABLED,
            transcriptEnabled
          );
        })
      ),
    { dispatch: false }
  );

  changeTranscriptFontsize$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(viewerActions.changeTranscriptFontsize),
        tap((action) => {
          this.storageService.storeInLocalStorage(
            StorageKey.VIEWER_TRANSCRIPT_FONTSIZE,
            action.transcriptFontsize
          );
        })
      ),
    { dispatch: false }
  );

  changeTranscriptPosition$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(viewerActions.changeTranscriptPosition),
        tap((action) => {
          this.storageService.storeInLocalStorage(
            StorageKey.VIEWER_TRANSCRIPT_POSITION,
            action.transcriptPosition
          );
        })
      ),
    { dispatch: false }
  );

  changeCaptionsBackgroundColor$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(viewerActions.changeCaptionsBackgroundColor),
        tap((action) => {
          this.storageService.storeInLocalStorage(
            StorageKey.CAPTIONS_BACKGROUND_COLOR,
            action.captionsBackgroundColor
          );
        })
      ),
    { dispatch: false }
  );

  changeCaptionsColor$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(viewerActions.changeCaptionsColor),
        tap((action) => {
          this.storageService.storeInLocalStorage(
            StorageKey.CAPTIONS_COLOR,
            action.captionsColor
          );
        })
      ),
    { dispatch: false }
  );

  changeCaptionsFontsize$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(viewerActions.changeCaptionsFontsize),
        tap((action) => {
          this.storageService.storeInLocalStorage(
            StorageKey.CAPTIONS_FONTSIZE,
            action.captionsFontsize
          );
        })
      ),
    { dispatch: false }
  );

  changeCaptionsPosition$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(viewerActions.changeCaptionsPosition),
        tap((action) => {
          this.storageService.storeInLocalStorage(
            StorageKey.CAPTIONS_POSITION,
            action.captionsPosition
          );
        })
      ),
    { dispatch: false }
  );
}
