import { Component, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { filter, Subject, takeUntil } from 'rxjs';
import { LogoComponent } from 'src/app/components/logo/logo.component';
import { ConfigService } from 'src/app/services/config/config.service';
import { AppState } from 'src/app/store/app.state';
import * as authSelector from '../../store/selectors/auth.selector';
import { LandingFooterComponent } from './components/landing-footer/landing-footer.component';
import { LandingHeaderComponent } from './components/landing-header/landing-header.component';
@Component({
  selector: 'app-landing',
  imports: [
    LandingHeaderComponent,
    LandingFooterComponent,
    RouterOutlet,
    MatSidenavModule,
    RouterLink,
    MatButtonModule,
    MatToolbarModule,
    LogoComponent,
    PushPipe,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements OnDestroy {
  disableLandingPage = this.configService.getDisableLandingPage();
  isLoggedIn$ = this.store.select(authSelector.selectIsLoggedIn);
  private destroy$$ = new Subject<void>();
  showHeader = true;

  constructor(
    private configService: ConfigService,
    private store: Store<AppState>,
    private router: Router
  ) {
    this.router.events
      .pipe(
        takeUntil(this.destroy$$),
        filter((event) => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        this.showHeader = event.urlAfterRedirects !== '/';
      });
  }

  ngOnDestroy(): void {
    this.destroy$$.next();
  }
}
