import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of, tap } from 'rxjs';
import { AlertService } from '../../services/alert/alert.service';
import { ApiService } from '../../services/api/api.service';
import { TranscriptionEntity } from '../../services/api/entities/transcription.entity';
import * as editorActions from '../actions/editor.actions';
import * as transcriptionsActions from '../actions/transcriptions.actions';

@Injectable({
  providedIn: 'root',
})
export class TranscriptionsEffects {
  constructor(
    private actions$: Actions,
    private api: ApiService,
    private alert: AlertService
  ) {}

  //TODO better naming than prepare___
  prepareFetchTranscription$ = createEffect(() =>
    this.actions$.pipe(
      ofType(editorActions.findProjectSuccess),
      map((action) => {
        return transcriptionsActions.findAllFromEffect({
          projectId: action.project.id,
        });
      })
    )
  );

  fetchTranscriptions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        transcriptionsActions.findAllFromEditor,
        transcriptionsActions.findAllFromEffect
      ),

      mergeMap((action) =>
        this.api.findAllTranscriptions(action.projectId).pipe(
          map((transcriptions: TranscriptionEntity[]) => {
            return transcriptionsActions.findAllSuccess({ transcriptions });
          }),
          catchError((error) => {
            console.log(error);
            return of(transcriptionsActions.findAllFail({ error }));
          }) //todo further error handling
        )
      )
    )
  );

  findOneTranscription$ = createEffect(() =>
    this.actions$.pipe(
      ofType(transcriptionsActions.findOne),
      mergeMap((action) =>
        this.api.findOneTranscription(action.transcriptionId).pipe(
          map((transcription: TranscriptionEntity) =>
            transcriptionsActions.findOneSuccess({ transcription })
          ),
          catchError((error) =>
            of(transcriptionsActions.findOneFail({ error }))
          )
        )
      )
    )
  );

  createTranscription$ = createEffect(() =>
    this.actions$.pipe(
      ofType(transcriptionsActions.create),
      mergeMap((action) =>
        this.api.createTranscription(action.newTranscription).pipe(
          map((transcription: TranscriptionEntity) =>
            transcriptionsActions.createSuccess({ transcription })
          ),
          catchError((error) => of(transcriptionsActions.createFail({ error })))
        )
      )
    )
  );

  updateTranscription$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        transcriptionsActions.updateFromEditor
        // transcriptionsActions.updateFromEditSpeaker
      ),
      mergeMap((action) =>
        this.api
          .updateTranscription(action.transcriptionId, action.transcription)
          .pipe(
            map((updatedTranscription: TranscriptionEntity) =>
              transcriptionsActions.updateSuccess({ updatedTranscription })
            ),
            catchError((error) =>
              of(transcriptionsActions.updateFail({ error }))
            )
          )
      )
    )
  );

  createSpeakers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        transcriptionsActions.createSpeakers
        // transcriptionsActions.updateFromEditSpeaker
      ),
      mergeMap((action) =>
        this.api
          .createSpeakers(action.transcriptionId, action.createSpeakersDto)
          .pipe(
            map((updatedTranscription: TranscriptionEntity) =>
              transcriptionsActions.updateSuccess({ updatedTranscription })
            ),
            catchError((error) =>
              of(transcriptionsActions.updateFail({ error }))
            )
          )
      )
    )
  );

  removeProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType(transcriptionsActions.removeFromEditor),
      mergeMap((action) =>
        this.api.removeTranscription(action.transcriptionId).pipe(
          map(() =>
            transcriptionsActions.removeSuccess({
              removedTranscriptionId: action.transcriptionId,
            })
          ),
          catchError((error) => of(transcriptionsActions.removeFail({ error })))
        )
      )
    )
  );

  downloadSubtitles$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(transcriptionsActions.downloadSubtitles),
        mergeMap((action) =>
          this.api
            .downloadSubtitles(action.transcriptionId, action.format)
            .pipe(
              map((res) => {
                //TODO
                const file = new window.Blob([res]);

                const downloadAncher = document.createElement('a');
                downloadAncher.style.display = 'none';

                const fileURL = URL.createObjectURL(file);
                downloadAncher.href = fileURL;
                downloadAncher.download = `subtitles.${action.format}`;
                downloadAncher.click();
                downloadAncher.remove();
              })
            )
        )
      ),
    { dispatch: false }
  );

  notifyOnError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          transcriptionsActions.findOneFail,
          transcriptionsActions.findAllFail,
          transcriptionsActions.createFail,
          transcriptionsActions.updateFail,
          transcriptionsActions.removeFail
        ),
        tap((action) =>
          this.alert.error(action.error.error?.message || action.error.message)
        )
      ),
    { dispatch: false }
  );
}
