import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { map, Observable, take } from 'rxjs';
import * as authSelectors from '../store/selectors/auth.selector';

@Injectable({
  providedIn: 'root',
})
export class HasRoleGuard implements CanActivate {
  constructor(private router: Router, private store: Store) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    return this.store.select(authSelectors.selectUser).pipe(
      take(1),
      map((user) => {
        if (user && route.data['roles'].includes(user.role)) {
          return true;
        }
        return this.router.createUrlTree(['home']);
      })
    );
  }
}
