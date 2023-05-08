import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, skipWhile, tap } from 'rxjs';
import { AppState } from '../store/app.state';
import * as authSelectors from '../store/selectors/auth.selector';

@Injectable({
  providedIn: 'root',
})
export class IsInitializedGuard  {
  constructor(private store: Store<AppState>, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.store.select(authSelectors.selectInitialized).pipe(
      skipWhile((isInitialized) => !isInitialized),
      tap(() => {
        return true;
      })
    );
  }
}
