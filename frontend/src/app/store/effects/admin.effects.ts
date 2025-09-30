import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, mergeMap, of, tap } from 'rxjs';
import { catchError } from 'rxjs/internal/operators/catchError';
import { AlertService } from 'src/app/services/alert/alert.service';
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
    private store: Store,
    private alertService: AlertService
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

  adminInit$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(adminActions.adminInit),
        tap(() => {
          const adminToken = this.storage.getFromSessionStorage<string | null>(
            StorageKey.ADMIN_TOKEN,
            null
          );

          if (adminToken) {
            this.store.dispatch(
              adminActions.adminLoginSuccess({ token: adminToken })
            );
          }
        })
      ),
    { dispatch: false }
  );

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
      ofType(adminActions.adminUpdateUserEmail),
      mergeMap(({ userId, email }) =>
        this.api.adminUpdateUserEmail(userId, email).pipe(
          map((user) => adminActions.adminUpdateUserEmailSuccess({ user })),
          catchError((error) =>
            of(adminActions.adminUpdateUserEmailFail({ error }))
          )
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
          map(({ method, password, user }) =>
            adminActions.adminCreateUserSuccess({ method, password, user })
          ),
          catchError((error) => {
            return of(adminActions.adminCreateUserFail({ error }));
          })
        )
      )
    )
  );

  adminVerifyUserEmail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(adminActions.adminVerifyUserEmail),
      mergeMap(({ userId }) =>
        this.api.adminVerifyUserEmail(userId).pipe(
          map((user) => adminActions.adminVerifyUserEmailSuccess({ user })),
          catchError((error) =>
            of(adminActions.adminVerifyUserEmailFail({ error }))
          )
        )
      )
    )
  );

  notifyOnError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          adminActions.adminVerifyUserEmailFail,
          adminActions.adminFindAllUsersFail,
          adminActions.adminDeleteUserAccountFail,
          adminActions.adminResetUserPasswordFail
        ),
        tap((action) =>
          this.alertService.error(
            action.error.error?.message || action.error.message
          )
        )
      ),
    { dispatch: false }
  );
}
