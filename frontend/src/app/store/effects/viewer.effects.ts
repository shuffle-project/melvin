import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { ApiService } from '../../services/api/api.service';
import * as viewerActions from '../actions/viewer.actions';

@Injectable()
export class ViewerEffects {
  constructor(private actions$: Actions, private api: ApiService) {}

  findProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType(viewerActions.findProject),
      switchMap((action) =>
        this.api.findOneProject(action.projectId).pipe(
          map((project) => viewerActions.findProjectSuccess({ project })),
          catchError((errorRes) =>
            of(viewerActions.findProjectFail({ error: errorRes }))
          )
        )
      )
    )
  );
}
