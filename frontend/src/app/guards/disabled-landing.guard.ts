import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { map, Observable, skipWhile, switchMap } from 'rxjs';
import { ConfigService } from '../services/config/config.service';
import { AppState } from '../store/app.state';
import * as authSelectors from '../store/selectors/auth.selector';

@Injectable({
  providedIn: 'root',
})
export class DisabledLandingGuard {
  disableLandingPage = this.configService.getDisableLandingPage();

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private configService: ConfigService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.store.select(authSelectors.selectInitialized).pipe(
      skipWhile((isInitialized) => !isInitialized),
      switchMap(() => {
        return this.store.select(authSelectors.selectIsLoggedIn).pipe(
          map((isLoggedIn) => {
            if (isLoggedIn && this.disableLandingPage) {
              return this.router.createUrlTree(['/home/projects']);
            }
            return true;
          })
        );
      })
    );
  }
}
