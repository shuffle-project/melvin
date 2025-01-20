import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  catchError,
  exhaustMap,
  map,
  of,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';
import { AlertService } from '../../services/alert/alert.service';
import { ApiService } from '../../services/api/api.service';
import { ViewerLoginEntity } from '../../services/api/entities/auth.entity';
import { TiptapCaption } from '../../services/api/entities/caption.entity';
import { TranscriptionEntity } from '../../services/api/entities/transcription.entity';
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
    private store: Store<AppState>,
    private alert: AlertService
  ) {}

  /**
   *
   *
   * DATA CHAIN
   *
   * login
   * ->
   * findProject & findProjectMedia & findTranscriptions
   * ->
   * selectTrasnscriptionId
   * ->
   * findCaptions
   *
   */

  /**
   * INIT
   */

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(viewerActions.viewerLogin),
      exhaustMap((action) =>
        this.api.viewerLogin(action.token).pipe(
          map((res: ViewerLoginEntity) =>
            viewerActions.viewerLoginSuccess({ viewerLoginEntity: res })
          ),
          catchError((res: HttpErrorResponse) => {
            return of(viewerActions.viewerLoginFail({ error: res.error }));
          })
        )
      )
    )
  );

  postLogin$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(viewerActions.viewerLoginSuccess),
        tap((action) => {
          const projectId = action.viewerLoginEntity.projectId;

          this.store.dispatch(viewerActions.findProject({ projectId }));
          this.store.dispatch(viewerActions.findProjectMedia({ projectId }));
          this.store.dispatch(viewerActions.findTranscriptions({ projectId }));
        })
      ),
    { dispatch: false }
  );

  /**
   * DATA
   */
  // fetchProject
  findProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType(viewerActions.findProject),
      switchMap((action) =>
        this.api.findOneProject(action.projectId, true).pipe(
          map((project) => viewerActions.findProjectSuccess({ project })),
          catchError((errorRes) =>
            of(viewerActions.findProjectFail({ error: errorRes }))
          )
        )
      )
    )
  );

  // fetchProjectMedia
  findProjectMedia$ = createEffect(() =>
    this.actions$.pipe(
      ofType(viewerActions.findProjectMedia),
      switchMap((action) =>
        this.api.findProjectMediaEntity(action.projectId, true).pipe(
          map((media) => viewerActions.findProjectMediaSuccess({ media })),
          catchError((errorRes) =>
            of(viewerActions.findProjectMediaFail({ error: errorRes }))
          )
        )
      )
    )
  );

  // fetchTranscriptions
  fetchTranscriptions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(viewerActions.findTranscriptions),
      switchMap((action) =>
        this.api.findAllTranscriptions(action.projectId, true).pipe(
          map((transcriptions: TranscriptionEntity[]) =>
            viewerActions.findTranscriptionsSuccess({ transcriptions })
          ),
          catchError((error) => {
            return of(viewerActions.findTranscriptionsFail({ error }));
          })
        )
      )
    )
  );

  postFetchTranscriptions$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(viewerActions.findTranscriptionsSuccess),
        tap((action) => {
          const firstTranscription = action.transcriptions[0];
          if (firstTranscription)
            this.store.dispatch(
              viewerActions.changeTranscriptionId({
                transcriptionId: firstTranscription.id,
              })
            );
        })
      ),
    { dispatch: false }
  );

  // this.api
  // .transcriptionGetCaptions(transcriptions[0].id, true)
  // .subscribe((res) => {
  //   console.log(res);
  // });
  // fetchCaptions
  fetchTiptapCaptions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(viewerActions.findCaptions, viewerActions.changeTranscriptionId),
      switchMap((action) =>
        this.api.transcriptionGetCaptions(action.transcriptionId, true).pipe(
          map((tiptapCaptions: TiptapCaption[]) => {
            return viewerActions.findCaptionsSuccess({ tiptapCaptions });
          }),
          catchError((error) => of(viewerActions.findCaptionsFail({ error })))
        )
      )
    )
  );

  // fetchCaptions$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(viewerActions.findCaptions, viewerActions.changeTranscriptionId),
  //     switchMap((action) =>
  //       this.api.findAllCaptions(action.transcriptionId, true).pipe(
  //         map((captionListEntity: CaptionListEntity) =>
  //           viewerActions.findCaptionsSuccess({ captionListEntity })
  //         ),
  //         catchError((error) => of(viewerActions.findCaptionsFail({ error })))
  //       )
  //     )
  //   )
  // );

  /**
   * ERRORS
   */
  notifyOnError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          viewerActions.findProjectFail,
          viewerActions.viewerLoginFail,
          viewerActions.findCaptionsFail,
          viewerActions.findProjectMediaFail,
          viewerActions.findTranscriptionsFail
        ),
        tap((action) =>
          this.alert.error(action.error.error?.message || action.error.message)
        )
      ),
    { dispatch: false }
  );

  /**
   * SETTINGS
   */

  // changeTranscriptEnabled$ = createEffect(
  //   () =>
  //     this.actions$.pipe(
  //       ofType(viewerActions.changeTranscriptEnabled),
  //       tap((action) => {
  //         this.storageService.storeInLocalStorage(
  //           StorageKey.VIEWER_TRANSCRIPT_ENABLED,
  //           action.transcriptEnabled
  //         );
  //       })
  //     ),
  //   { dispatch: false }
  // );

  // toggleTranscriptEnabled$ = createEffect(
  //   () =>
  //     this.actions$.pipe(
  //       ofType(viewerActions.toggleTranscript),
  //       withLatestFrom(this.store.select(viewerSelector.vTranscriptEnabled)),
  //       tap(([action, transcriptEnabled]) => {
  //         this.storageService.storeInLocalStorage(
  //           StorageKey.VIEWER_TRANSCRIPT_ENABLED,
  //           transcriptEnabled
  //         );
  //       })
  //     ),
  //   { dispatch: false }
  // );

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
        ofType(viewerActions.changeTranscriptPositionControls),
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

  toggleMute$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(viewerActions.toggleMute),
        withLatestFrom(this.store.select(viewerSelector.vMuted)),
        tap(([action, muted]) => {
          this.storageService.storeInSessionStorage(
            StorageKey.VIEWER_MEDIA_MUTED,
            muted
          );
        })
      ),
    { dispatch: false }
  );

  changeVolume$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(viewerActions.changeVolume),
        tap((action) => {
          this.storageService.storeInSessionStorage(
            StorageKey.VIEWER_MEDIA_VOLUME,
            action.newVolume
          );
        })
      ),
    { dispatch: false }
  );

  subtitlesEnabledInVideo$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(viewerActions.toggleSubtitles),
        withLatestFrom(this.store.select(viewerSelector.vSubtitlesEnabled)),
        map(([action, enabled]) => {
          this.storageService.storeInLocalStorage(
            StorageKey.VIEWER_SUBTITLES_ENABLED,
            enabled
          );
        })
      ),
    { dispatch: false }
  );

  changeMaxResolution$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(viewerActions.changeMaxResolution),
        tap((action) => {
          this.storageService.storeInLocalStorage(
            StorageKey.VIEWER_MAX_RESOLUTION,
            action.newMaxResolution
          );
        })
      ),
    { dispatch: false }
  );
}
