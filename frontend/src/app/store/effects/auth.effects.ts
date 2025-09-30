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
import { AlertService } from '../../services/alert/alert.service';
import { ApiService } from '../../services/api/api.service';
import {
  ChangePasswordEntity,
  GuestLoginEntity,
} from '../../services/api/entities/auth.entity';
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
    private storage: StorageService,
    private alert: AlertService
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

  refreshToken$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.refreshToken),
      withLatestFrom(this.store.select(authSelectors.selectToken)),
      map(([, token]) => {
        return authActions.initRefreshToken({ token: token ?? '' });
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
        withLatestFrom(this.store.select(authSelectors.selectInviteTokenCache)),
        tap(([res, inviteToken]) => {
          if (inviteToken) {
            this.router.navigate(['/invite/' + inviteToken]);
          } else {
            this.router.navigate(res.token ? ['/home'] : ['/']);
          }
        })
      ),
    { dispatch: false }
  );

  // Change password
  changePassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.changePassword),
      exhaustMap((action) =>
        this.api.changePassword(action.dto).pipe(
          map((entity: ChangePasswordEntity) => {
            const token = entity.token;

            this._replaceTokenInStorage(token);

            this.alert.success('Password successfully changed!');

            return authActions.changePasswordSuccess({ entity });
          }),
          catchError((res: HttpErrorResponse) => {
            return of(authActions.changePasswordError({ error: res.error }));
          })
        )
      )
    )
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
          this.router.navigate(['/']);
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
            // TODO refactor login after register
            this.store.dispatch(
              authActions.login({
                email: action.email,
                password: action.password,
                persistent: false,
              })
            );
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
          withLatestFrom(
            this.store.select(authSelectors.selectInviteTokenRoute)
          ),
          exhaustMap(([action, token]) =>
            this.api.verifyInviteToken(token as any).pipe(
              map((res) => {
                return authActions.verifyInviteTokenSuccess({
                  inviteEntity: res,
                  token: token!,
                });
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

  // withLatestFrom(authSelectors.selectInviteTokenRoute)

  guestLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.guestLogin),
      switchMap((action) =>
        of(action).pipe(
          withLatestFrom(
            this.store.select(authSelectors.selectInviteTokenRoute)
          ),
          exhaustMap(([action, token]) =>
            this.api.guestLogin(token, action.name).pipe(
              map((res) => {
                return authActions.guestLoginSuccess(res);
              }),
              catchError((res: HttpErrorResponse) => {
                return of(authActions.guestLoginError({ error: res.error }));
              })
            )
          )
        )
      )
    )
  );

  guestLoginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(authActions.guestLoginSuccess),
        tap((guestLoginEntity: GuestLoginEntity) => {
          console.log(guestLoginEntity);
          this.router.navigate(['/home/editor/' + guestLoginEntity.projectId]);
        })
      ),
    { dispatch: false }
  );

  private _replaceTokenInStorage(token: string) {
    // if token exists in localstorage, replace
    const tokenInLocalStorage = this.storage.getFromLocalStorage(
      StorageKey.ACCESS_TOKEN,
      token
    );
    if (tokenInLocalStorage) {
      this.storage.storeInLocalStorage(StorageKey.ACCESS_TOKEN, token);
    }

    // if token exists in sessionstorage, replace
    const tokenInSessionstorage = this.storage.getFromSessionStorage(
      StorageKey.ACCESS_TOKEN,
      token
    );
    if (tokenInSessionstorage) {
      this.storage.storeInSessionStorage(StorageKey.ACCESS_TOKEN, token);
    }
  }
}
