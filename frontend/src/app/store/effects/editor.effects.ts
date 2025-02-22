import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import { ApiService } from '../../services/api/api.service';
import { StorageKey } from '../../services/storage/storage-key.enum';
import { StorageService } from '../../services/storage/storage.service';
import { AppState } from '../app.state';
import * as editorSelectors from '../selectors/editor.selector';
import * as editorActions from './../actions/editor.actions';

@Injectable({
  providedIn: 'root',
})
export class EditorEffects {
  constructor(
    private actions$: Actions,
    private storageService: StorageService,
    private api: ApiService,
    private store: Store<AppState>,
    private httpClient: HttpClient
  ) {}

  changeVolume$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(editorActions.changeVolumeFromVideoComponent),
        tap((action) => {
          this.storageService.storeInSessionStorage(
            StorageKey.MEDIA_VOLUME,
            action.volume
          );
        })
      ),
    { dispatch: false }
  );

  changeMuted$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(editorActions.toggleMutedFromEditor),
        withLatestFrom(this.store.select(editorSelectors.selectMuted)),
        tap(([action, muted]) => {
          this.storageService.storeInSessionStorage(
            StorageKey.EDITOR_MEDIA_MUTED,
            muted
          );
        })
      ),
    { dispatch: false }
  );

  subtitlesEnabledInVideo$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(editorActions.toggleSubtitlesFromEditor),
        withLatestFrom(
          this.store.select(editorSelectors.selectSubtitlesEnabledInVideo)
        ),
        map(([action, enabled]) => {
          this.storageService.storeInLocalStorage(
            StorageKey.MEDIA_SUBTITLES_ENABLED,
            enabled
          );
        })
      ),
    { dispatch: false }
  );

  findProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType(editorActions.findProjectFromEditor),
      switchMap((action) =>
        this.api.findOneProject(action.projectId).pipe(
          map((project) => editorActions.findProjectSuccess({ project })),
          catchError(
            (errorRes) => of(editorActions.findProjectFail({ error: errorRes })) // TODO
          )
        )
      )
    )
  );

  // media
  findMedia$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        editorActions.findProjectMedia,
        editorActions.findProjectFromEditor
      ),
      switchMap((action) =>
        this.api.findProjectMediaEntity(action.projectId).pipe(
          map((media) => editorActions.findProjectMediaSuccess({ media })),
          catchError(
            (errorRes) =>
              of(editorActions.findProjectMediaFail({ error: errorRes })) // TODO
          )
        )
      )
    )
  );

  deleteMedia$ = createEffect(() =>
    this.actions$.pipe(
      ofType(editorActions.deleteProjectMedia),
      switchMap((action) =>
        this.api.deleteMedia(action.projectId, action.mediaId).pipe(
          map((media) => editorActions.deleteProjectMediaSuccess({ media })),
          catchError(
            (errorRes) =>
              of(editorActions.deleteProjectMediaFail({ error: errorRes })) // TODO
          )
        )
      )
    )
  );

  // this.httpClient.get(action.media.audios[0].waveform)

  getWaveform$ = createEffect(() =>
    this.actions$.pipe(
      ofType(editorActions.findProjectMediaSuccess),
      // TODO maybe this should not happen every time after fetching the mediaEntity
      // and choosing the audio somewhere is at some point necessary
      switchMap((action) =>
        this.api
          .getWaveformData(action.media.audios[0].waveform)
          // this.httpClient.get<WaveformData>(action.media.audios[0].waveform)
          .pipe(
            map((data) => editorActions.getWaveformSuccess(data)),
            catchError((errorRes) =>
              of(editorActions.getWaveformFail({ error: errorRes }))
            )
          )
      )
    )
  );
}
