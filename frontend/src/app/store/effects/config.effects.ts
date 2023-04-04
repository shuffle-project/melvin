import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of, tap } from 'rxjs';
import { AlertService } from '../../services/alert/alert.service';
import { ApiService } from '../../services/api/api.service';
import * as configActions from '../actions/config.actions';

@Injectable()
export class ConfigEffects {
  constructor(
    private actions$: Actions,
    private api: ApiService,
    private alert: AlertService
  ) {}

  fetchConfig = createEffect(() =>
    this.actions$.pipe(
      ofType(configActions.fetch),
      mergeMap(
        (action) =>
          this.api.getConfig().pipe(
            map((resData) => {
              return configActions.fetchSuccess({ configEntity: resData });
            }),
            catchError((error) => of(configActions.fetchFailed({ error })))
          ) //TODO further error handling
      )
    )
  );

  notifyOnError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(configActions.fetchFailed),
        tap((action) =>
          this.alert.error(action.error.error?.message || action.error.message)
        )
      ),
    { dispatch: false }
  );
}
