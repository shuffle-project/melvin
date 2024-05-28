import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import dayjs from 'dayjs';
import { Observable, Subject, takeUntil, tap } from 'rxjs';
import { ICONS } from './constants/icon.constants';
import { AppService } from './services/app/app.service';
import * as authActions from './store/actions/auth.actions';
import { AppState } from './store/app.state';
import { ColorTheme } from './store/reducers/config.reducer';
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

  public colorTheme$ = this.store.select(configSelector.colorTheme);

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
    dayjs.locale($localize.locale);

    this.store.dispatch(authActions.init());
    this.appService.init();

    this.colorTheme$
      .pipe(
        takeUntil(this.destroy$$),
        tap((colorTheme) => {
          switch (colorTheme) {
            case ColorTheme.DARK:
              document.body.classList.add('dark-theme');
              break;
            case ColorTheme.LIGHT:
              document.body.classList.remove('dark-theme');
              break;
            case ColorTheme.SYSTEM:
              if (window.matchMedia) {
                // Check if the dark-mode Media-Query matches
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  // Dark
                  document.body.classList.add('dark-theme');
                } else {
                  // Light
                  document.body.classList.remove('dark-theme');
                }
              }
              break;

            default:
              break;
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
