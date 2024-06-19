import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, mergeMap, of, tap, withLatestFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api/api.service';
import { MediaService } from '../../routes/home/editor/services/media/media.service';
import { AlertService } from '../../services/alert/alert.service';
import { CaptionListEntity } from '../../services/api/entities/caption-list.entity';
import { CaptionEntity } from '../../services/api/entities/caption.entity';
import * as captionsActions from '../actions/captions.actions';
import * as transcriptionsActions from '../actions/transcriptions.actions';
import { selectQueryParam } from '../selectors/router.selectors';
import {
  selectAvailableSpeakers,
  selectTranscriptionId,
} from '../selectors/transcriptions.selector';

@Injectable({
  providedIn: 'root',
})
export class CaptionsEffects {
  constructor(
    private actions$: Actions,
    private api: ApiService,
    private store: Store,
    private alert: AlertService,
    private mediaService: MediaService
  ) {}

  setupFetchCaptions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(transcriptionsActions.findAllSuccess),
      withLatestFrom(this.store.select(selectQueryParam('transcriptionId'))),
      map(([action, queryParam]) => {
        // use first transcription if query param is not defined
        const choosenTranscription =
          queryParam &&
          action.transcriptions.some((obj) => obj.id === queryParam)
            ? queryParam
            : action.transcriptions.length > 0
            ? action.transcriptions[0].id
            : '';

        // if statement handles scenario where the project has no transcriptions and therefore
        // no captions
        if (choosenTranscription) {
          return captionsActions.findAllFromEffect({
            transcriptionId: choosenTranscription as string,
          });
        } else {
          // add empty caption list to prevent this scenario:
          // If you go in Project B (with transcripts / editor mode) and then into
          // Project A (with no transcripts / editor mode), the old transcriptions will still show up.
          const captionListEntity = {
            captions: [],
            total: 0,
            page: 0,
          };
          return captionsActions.findAllSuccess({ captionListEntity });
        }
      })
    )
  );

  fetchCaptions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        transcriptionsActions.selectFromEditor,
        transcriptionsActions.selectFromViewer,
        captionsActions.findAllFromEffect
      ),
      mergeMap(
        (action) =>
          this.api.findAllCaptions(action.transcriptionId).pipe(
            map((captionListEntity: CaptionListEntity) =>
              captionsActions.findAllSuccess({ captionListEntity })
            ),
            catchError((error) => of(captionsActions.findAllFail({ error })))
          ) //todo further error handling
      )
    )
  );

  createInitialCaption$ = createEffect(() =>
    this.actions$.pipe(
      ofType(captionsActions.createInitialCaption),
      withLatestFrom(
        this.store.select(selectTranscriptionId),
        this.store.select(selectAvailableSpeakers)
      ),
      mergeMap(
        ([action, transcriptionId, speakers]) =>
          this.api
            .createCaption({
              start: 0,
              end: 30000,
              text: 'First caption!',
              transcription: transcriptionId,
              speakerId: speakers[0].id,
            })
            .pipe(
              map((newCaption) => {
                return captionsActions.createSuccess({ newCaption });
              }),
              catchError((error) => of(captionsActions.createFailed({ error })))
            ) //TODO further error handling
      )
    )
  );

  createCaption$ = createEffect(() =>
    this.actions$.pipe(
      ofType(captionsActions.create),
      mergeMap(
        (action) =>
          this.api.createCaption(action.captionDto).pipe(
            map((newCaption) => {
              return captionsActions.createSuccess({ newCaption });
            }),
            catchError((error) => of(captionsActions.createFailed({ error })))
          ) //TODO further error handling
      )
    )
  );

  updateCaption$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        captionsActions.update,
        captionsActions.updateAndUnselect,
        captionsActions.updateEffectOnly
      ),
      mergeMap(
        ({ id, updateDto }) =>
          this.api.updateCaption(id, updateDto).pipe(
            map((updateCaption: CaptionEntity) => {
              return captionsActions.updateSuccess({ updateCaption });
            }),
            catchError((error) => of(captionsActions.updateFailed({ error })))
          ) //TODO further error handling
      )
    )
  );

  removeCaption$ = createEffect(() =>
    this.actions$.pipe(
      ofType(captionsActions.remove),
      mergeMap(
        (action) =>
          this.api.removeCaption(action.removeCaptionId).pipe(
            map((resData) => {
              return captionsActions.removeSuccess();
            }),
            catchError((error) => of(captionsActions.removeFailed({ error })))
          ) //TODO further error handling
      )
    )
  );

  notifyOnError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          captionsActions.createFailed,
          captionsActions.removeFailed,
          captionsActions.updateFailed,
          captionsActions.findAllFail
        ),
        tap((action) =>
          this.alert.error(action.error.error?.message || action.error.message)
        )
      ),
    { dispatch: false }
  );

  eventuallyJumpToNewestCaption = createEffect(
    () =>
      this.actions$.pipe(
        ofType(captionsActions.createFromWS),
        tap((action) => {
          this.mediaService.captionCreated$.next(action.newCaption);
        })
      ),
    { dispatch: false }
  );
}
