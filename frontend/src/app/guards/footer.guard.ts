import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { ConfigService } from '../services/config/config.service';

@Injectable({
  providedIn: 'root',
})
export class FooterGuard {
  constructor(private configService: ConfigService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    switch (state.url) {
      case '/privacy':
        if (!this.configService.getPrivacyUrl()) {
          return this.router.createUrlTree(['/']);
        }
        return true;
      case '/imprint':
        if (!this.configService.getImprintUrl()) {
          return this.router.createUrlTree(['/']);
        }
        return true;
      case '/accessibility-statement':
        if (!this.configService.getAccessibilityStatementUrl()) {
          return this.router.createUrlTree(['/']);
        }
        return true;
      case '/installation':
        if (this.configService.getDisableInstallationPage()) {
          console.log(1);
          return this.router.createUrlTree(['/']);
        }
        return true;
      default:
        return true;
    }
  }
}
