import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, mergeMap, of, tap, withLatestFrom } from 'rxjs';
import { AlertService } from '../../services/alert/alert.service';
import { ApiService } from '../../services/api/api.service';
import { StorageKey } from '../../services/storage/storage-key.enum';
import { StorageService } from '../../services/storage/storage.service';
import * as configActions from '../actions/config.actions';
import { darkMode } from '../selectors/config.selector';
@Injectable({
  providedIn: 'root',
})
export class ConfigEffects {
  constructor(
    private actions$: Actions,
    private api: ApiService,
    private alert: AlertService,
    private store: Store,
    private storageService: StorageService
  ) {}

  fetchConfig = createEffect(() =>
    this.actions$.pipe(
      ofType(configActions.fetch),
      mergeMap(
        () =>
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

  // changeLanguageFromUrl$ = createEffect(
  //   () =>
  //     this.store.select(routerSelectors.selectUrl).pipe(
  //       withLatestFrom(this.store.select(language)),
  //       tap(([url, language]) => {
  //         console.log('====================');
  //         console.log(url, language);
  //         $localize.locale;
  //         if (!url) return;

  //         const languageInUrl = url.split('/')[0];
  //         if (languageInUrl === language) return;

  //         const availableLanguages: string[] = [
  //           PageLanguage.DE_DE,
  //           PageLanguage.EN_US,
  //         ];
  //         if (!availableLanguages.includes(languageInUrl)) return;

  //         this.store.dispatch(
  //           configActions.changeLanguage({
  //             language: languageInUrl as PageLanguage,
  //           })
  //         );
  //       })
  //     ),
  //   { dispatch: false }
  // );

  // changeLanguage$ = createEffect(
  //   () =>
  //     this.actions$.pipe(
  //       ofType(configActions.changeLanguage),
  //       tap((action) => {
  //         this.storageService.storeInLocalStorage(
  //           StorageKey.LANGUAGE_SETTING,
  //           action.language
  //         );

  //         switch (action.language) {
  //           case PageLanguage.DE_DE:
  //             dayjs.locale('de');
  //             break;
  //           case PageLanguage.EN_US:
  //             dayjs.locale('en');
  //             break;

  //           default:
  //             dayjs.locale('en');
  //             break;
  //         }
  //       })
  //     ),
  //   { dispatch: false }
  // );

  toggleDarkMode$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(configActions.toggleDarkMode),
        withLatestFrom(this.store.select(darkMode)),
        tap(([action, darkMode]) => {
          this.storageService.storeInLocalStorage(
            StorageKey.DARK_MODE,
            darkMode
          );
        })
      ),
    { dispatch: false }
  );
}
