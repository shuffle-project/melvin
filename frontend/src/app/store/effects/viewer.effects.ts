import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs';
import { ApiService } from '../../services/api/api.service';
import { StorageKey } from '../../services/storage/storage-key.enum';
import { StorageService } from '../../services/storage/storage.service';
import * as viewerActions from '../actions/viewer.actions';

@Injectable()
export class ViewerEffects {
  constructor(
    private actions$: Actions,
    private api: ApiService,
    private storageService: StorageService
  ) {}

  changeVideoArrangement$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(viewerActions.changeVideoArrangement),
        tap((action) => {
          this.storageService.storeInSessionStorage(
            StorageKey.VIEWER_VIDEO_ARRANGEMENT,
            action.videoArrangement
          );
        })
      ),
    { dispatch: false }
  );

  changeTranscriptEnabled$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(viewerActions.changeTranscriptEnabled),
        tap((action) => {
          this.storageService.storeInSessionStorage(
            StorageKey.VIEWER_TRANSCRIPT_ENABLED,
            action.transcriptEnabled
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
          this.storageService.storeInSessionStorage(
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
          this.storageService.storeInSessionStorage(
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
          this.storageService.storeInSessionStorage(
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
          this.storageService.storeInSessionStorage(
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
          this.storageService.storeInSessionStorage(
            StorageKey.CAPTIONS_FONTSIZE,
            action.captionsFontsize
          );
        })
      ),
    { dispatch: false }
  );
}
