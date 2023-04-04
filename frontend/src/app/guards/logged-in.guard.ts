import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { map, Observable, skipWhile, switchMap } from 'rxjs';
import { AppState } from '../store/app.state';
import * as authSelectors from '../store/selectors/auth.selector';

@Injectable({
  providedIn: 'root',
})
export class LoggedInGuard implements CanActivate {
  constructor(private store: Store<AppState>, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.store.select(authSelectors.selectInitialized).pipe(
      skipWhile((isInitialized) => !isInitialized),
      switchMap(() => {
        return this.store.select(authSelectors.selectIsLoggedIn).pipe(
          map((isLoggedIn) => {
            if (isLoggedIn) {
              return true;
            }
            return this.router.createUrlTree(['/auth']);
          })
        );
      })
    );
  }
}
