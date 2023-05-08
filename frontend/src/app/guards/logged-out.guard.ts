import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, Observable, skipWhile, switchMap } from 'rxjs';
import { AppState } from '../store/app.state';
import * as authSelectors from '../store/selectors/auth.selector';

@Injectable({
  providedIn: 'root',
})
export class LoggedOutGuard  {
  constructor(private store: Store<AppState>, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.store.select(authSelectors.selectInitialized).pipe(
      skipWhile((isInitialized) => !isInitialized),
      switchMap(() => {
        return this.store.select(authSelectors.selectIsLoggedOut).pipe(
          map((isLoggedOut) => {
            if (isLoggedOut) {
              return true;
            }
            return this.router.createUrlTree(['/home']);
          })
        );
      })
    );
  }
}
