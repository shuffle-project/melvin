import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, mergeMap, of, tap } from 'rxjs';
import { catchError } from 'rxjs/internal/operators/catchError';
import { ApiService } from 'src/app/services/api/api.service';
import { StorageKey } from 'src/app/services/storage/storage-key.enum';
import { StorageService } from 'src/app/services/storage/storage.service';
import * as adminActions from '../actions/admin.actions';

@Injectable({
  providedIn: 'root',
})
export class AdminEffects {
  constructor(
    private actions$: Actions,
    private api: ApiService,
    private storage: StorageService,
    private router: Router,
    private store: Store
  ) {}

  adminLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(adminActions.loginAdmin),
      mergeMap(({ username, password }) =>
        this.api.loginAdmin(username, password).pipe(
          map(({ token }) => adminActions.loginAdminSuccess({ token })),
          catchError((error) => of(adminActions.loginAdminFail({ error })))
        )
      )
    )
  );

  adminLoginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(adminActions.loginAdminSuccess),
        tap(({ token }) => {
          this.storage.storeInSessionStorage(StorageKey.ADMIN_TOKEN, token);
          this.store.dispatch(adminActions.findAllUsers());
        })
      ),
    { dispatch: false }
  );

  // TODO Login Fail

  adminLogout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(adminActions.logoutAdmin),
        tap(() => {
          this.storage.removeFromSessionStorage(StorageKey.ADMIN_TOKEN);
        })
      ),
    { dispatch: false }
  );

  findAllUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(adminActions.findAllUsers),
      mergeMap(() =>
        this.api.adminFindAllUsers().pipe(
          map((userList) => adminActions.findAllUsersSuccess({ userList })),
          // TODO Catch Error add findAllUsersFail
          catchError((error) => of(adminActions.findAllUsersFail({ error })))
        )
      )
    )
  );
}

// fetchProjects$ = createEffect(() =>
//     this.actions$.pipe(
//       ofType(projectsActions.findAll),
//       mergeMap(() =>
//         this.api.findAllProjects().pipe(
//           map((projectListEntity: ProjectListEntity) => {
//             return projectsActions.findAllSuccess({ projectListEntity });
//           }),
//           catchError((errorRes) =>
//             // TODO Add reducer that listens
//             of(projectsActions.findAllFail({ error: errorRes }))
//           )
//         )
//       )
//     )
//   );
