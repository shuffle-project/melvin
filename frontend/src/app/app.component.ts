import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil, tap } from 'rxjs';
import { ICONS } from './constants/icon.constants';
import { AppService } from './services/app/app.service';
import * as authActions from './store/actions/auth.actions';
import { AppState } from './store/app.state';
import * as authSelectors from './store/selectors/auth.selector';
import * as configSelector from './store/selectors/config.selector';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [RouterOutlet, MatProgressSpinnerModule, PushPipe],
})
export class AppComponent implements OnInit, OnDestroy {
  private destroy$$ = new Subject<void>();
  public isInitialized$: Observable<boolean>;

  public darkMode$ = this.store.select(configSelector.darkMode);

  constructor(
    private domSanitizer: DomSanitizer,
    private matIconRegistry: MatIconRegistry,
    private store: Store<AppState>,
    private appService: AppService
  ) {
    this.registerIcons();

    this.isInitialized$ = this.store.select(authSelectors.selectInitialized);
  }

  ngOnInit(): void {
    this.store.dispatch(authActions.init());
    this.appService.init();

    this.darkMode$
      .pipe(
        takeUntil(this.destroy$$),
        tap((darkMode) => {
          if (darkMode) {
            // dark mode ON
            document.body.classList.add('dark-theme');
          } else {
            // dark mode OFF
            document.body.classList.remove('dark-theme');
          }
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$$.next();
  }

  private registerIcons() {
    ICONS.map((o) =>
      this.matIconRegistry.addSvgIcon(
        o,
        this.domSanitizer.bypassSecurityTrustResourceUrl(
          `assets/icons/${o}.svg`
        )
      )
    );
  }
}
