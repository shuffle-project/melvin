import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
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
import { CustomLogger } from '../../classes/logger.class';
import { ApiService } from '../../services/api/api.service';
import { StorageKey } from '../../services/storage/storage-key.enum';
import { StorageService } from '../../services/storage/storage.service';
import * as authActions from '../actions/auth.actions';
import * as authSelectors from '../selectors/auth.selector';

@Injectable({
  providedIn: 'root',
})
export class AuthEffects {
  private logger = new CustomLogger('AUTH EFFECTS');

  constructor(
    private store: Store,
    private actions$: Actions,
    private router: Router,
    private api: ApiService,
    private storage: StorageService
  ) {}

  // Initialization

  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.init),
      map(() => {
        const token = this.storage.getFromSessionOrLocalStorage<string | null>(
          StorageKey.ACCESS_TOKEN,
          null
        );

        // TODO hier den call um die config abzurufen
        if (!token) {
          return authActions.initSuccess({ token: null });
        }

        return authActions.initRefreshToken({ token });
      })
    )
  );

  initRefreshToken = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.initRefreshToken),
      exhaustMap((action) =>
        this.api.refreshToken(action.token).pipe(
          map((res: any) => {
            const token = res.token;

            // Update token in storage
            const persistent = this.storage.existsInLocalStorage(
              StorageKey.ACCESS_TOKEN
            );
            if (persistent) {
              this.storage.storeInLocalStorage(StorageKey.ACCESS_TOKEN, token);
            } else {
              this.storage.storeInSessionStorage(
                StorageKey.ACCESS_TOKEN,
                token
              );
            }

            return authActions.initSuccess({ token });
          }),
          catchError((err: HttpErrorResponse) => {
            this.logger.error(err.message, err);

            // Remove invalid token from storage
            this.storage.removeFromSessionAndLocalStorage(
              StorageKey.ACCESS_TOKEN
            );

            return of(authActions.initSuccess({ token: null }));
          })
        )
      )
    )
  );

  // Login

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.login),
      exhaustMap((action) =>
        this.api.login(action.email, action.password).pipe(
          map((res: any) => {
            const token = res.token;

            if (action.persistent) {
              this.storage.storeInLocalStorage(StorageKey.ACCESS_TOKEN, token);
            } else {
              this.storage.storeInSessionStorage(
                StorageKey.ACCESS_TOKEN,
                token
              );
            }

            this.storage.storeInLocalStorage(
              StorageKey.LOGIN_EMAIL,
              action.email
            );

            return authActions.loginSuccess({ token });
          }),
          catchError((res: HttpErrorResponse) => {
            return of(authActions.loginError({ error: res.error }));
          })
        )
      )
    )
  );

  loginRedirect$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(authActions.loginSuccess),
        tap((res) => {
          this.router.navigate(res.token ? ['/home'] : ['/auth']);
        })
      ),
    { dispatch: false }
  );

  // Logout

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(authActions.logout),
        tap(() => {
          this.storage.removeFromSessionAndLocalStorage(
            StorageKey.ACCESS_TOKEN
          );
          this.router.navigate(['/auth']);
        })
      ),
    { dispatch: false }
  );

  // Register

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.register),
      exhaustMap((action) =>
        this.api.register(action.email, action.password, action.name).pipe(
          map(() => {
            return authActions.registerSuccess();
          }),
          catchError((res: HttpErrorResponse) => {
            return of(authActions.registerError({ error: res.error }));
          })
        )
      )
    )
  );

  // Invite

  verifyInviteToken$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.verifyInviteToken),
      switchMap((action) =>
        of(action).pipe(
          withLatestFrom(this.store.select(authSelectors.selectInviteToken)),
          exhaustMap(([action, token]) =>
            this.api.verifyInviteToken(token as any).pipe(
              map((res) => {
                return authActions.verifyInviteTokenSuccess(res);
              }),
              catchError((res: HttpErrorResponse) => {
                return of(
                  authActions.verifyInviteTokenError({ error: res.error })
                );
              })
            )
          )
        )
      )
    )
  );

  guestLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.guestLogin),
      tap(() => console.log('guestLogin')),
      exhaustMap((action) =>
        this.api.guestLogin('', action.name).pipe(
          map((res) => {
            return authActions.guestLoginSuccess(res);
          }),
          catchError((res: HttpErrorResponse) => {
            return of(authActions.guestLoginError({ error: res.error }));
          })
        )
      )
    )
  );
}