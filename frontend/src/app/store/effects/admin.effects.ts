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
      ofType(adminActions.adminLogin),
      mergeMap(({ username, password }) =>
        this.api.adminLogin(username, password).pipe(
          map(({ token }) => adminActions.adminLoginSuccess({ token })),
          catchError((error) => of(adminActions.adminLoginFail({ error })))
        )
      )
    )
  );

  adminLoginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(adminActions.adminLoginSuccess),
        tap(({ token }) => {
          this.storage.storeInSessionStorage(StorageKey.ADMIN_TOKEN, token);
          this.store.dispatch(adminActions.adminFindAllUsers());
        })
      ),
    { dispatch: false }
  );

  // TODO Login Fail

  adminLogout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(adminActions.adminLogout),
        tap(() => {
          this.storage.removeFromSessionStorage(StorageKey.ADMIN_TOKEN);
        })
      ),
    { dispatch: false }
  );

  adminFindAllUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(adminActions.adminFindAllUsers),
      mergeMap(() =>
        this.api.adminFindAllUsers().pipe(
          map((userList) =>
            adminActions.adminFindAllUsersSuccess({ userList })
          ),
          // TODO Catch Error add findAllUsersFail
          catchError((error) =>
            of(adminActions.adminFindAllUsersFail({ error }))
          )
        )
      )
    )
  );

  adminDeleteUserAccount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(adminActions.adminDeleteUserAccount),
      mergeMap(({ userId }) =>
        this.api.adminDeleteUserAccount(userId).pipe(
          map(() => {
            return adminActions.adminDeleteUserAccountSuccess({ userId });
          }),
          catchError((error) =>
            of(adminActions.adminDeleteUserAccountFail({ error }))
          )
        )
      )
    )
  );

  adminUpdateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(adminActions.adminUpdateUser),
      mergeMap(({ userId, email, name }) =>
        this.api.adminUpdateUser(userId, email, name).pipe(
          map((user) => adminActions.adminUpdateUserSuccess({ user })),
          catchError((error) => of(adminActions.adminUpdateUserFail({ error })))
        )
      )
    )
  );

  adminResetUserPassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(adminActions.adminResetUserPassword),
      mergeMap(({ userId }) =>
        this.api.adminResetUserPassword(userId).pipe(
          map(({ method, password }) =>
            adminActions.adminResetUserPasswordSuccess({ method, password })
          ),
          catchError((error) =>
            of(adminActions.adminResetUserPasswordFail({ error }))
          )
        )
      )
    )
  );

  adminCreateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(adminActions.adminCreateUser),
      mergeMap(({ email, name }) =>
        this.api.adminCreateUser(email, name).pipe(
          map(({ method, password }) =>
            adminActions.adminCreateUserSuccess({ method, password })
          ),
          catchError((error) => of(adminActions.adminCreateUserFail({ error })))
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
