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

@Injectable()
export class EditorEffects {
  constructor(
    private actions$: Actions,
    private storageService: StorageService,
    private api: ApiService,
    private store: Store<AppState>
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

  subtitlesEnabledInVideo$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(editorActions.toggleSubtitles),
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
      ofType(editorActions.findProject),
      switchMap((action) =>
        this.api.findOneProject(action.projectId).pipe(
          map((project) => editorActions.findProjectSuccess({ project })),
          catchError((errorRes) =>
            of(editorActions.findProjectFail({ error: errorRes }))
          )
        )
      )
    )
  );

  getWaveform$ = createEffect(() =>
    this.actions$.pipe(
      ofType(editorActions.findProjectSuccess),
      switchMap((action) =>
        this.api.getWaveformData(action.project.id).pipe(
          map((data) => editorActions.getWaveformSuccess(data)),
          catchError((errorRes) =>
            of(editorActions.getWaveformFail({ error: errorRes }))
          )
        )
      )
    )
  );
}
