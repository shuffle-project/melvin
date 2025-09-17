import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import dayjs from 'dayjs';
import { combineLatest, map, Observable, Subject, takeUntil, tap } from 'rxjs';
import { ICONS } from './constants/icon.constants';
import { AppService } from './services/app/app.service';
import { StorageKey } from './services/storage/storage-key.enum';
import * as authActions from './store/actions/auth.actions';
import * as configActions from './store/actions/config.actions';
import * as viewerActions from './store/actions/viewer.actions';
import { AppState } from './store/app.state';
import { ColorTheme } from './store/reducers/config.reducer';
import * as authSelectors from './store/selectors/auth.selector';
import * as configSelector from './store/selectors/config.selector';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
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

    this.isInitialized$ = combineLatest([
      this.store.select(authSelectors.selectInitialized),
      this.store.select(configSelector.isInitialized),
    ]).pipe(
      map(
        ([authInitialized, configInitialized]) =>
          authInitialized && configInitialized
      )
    );
  }

  ngOnInit(): void {
    this.store.dispatch(configActions.fetch());

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

    window.addEventListener('storage', (event) => {
      this.handleStorageEvent(event);
    });
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

  private handleStorageEvent(event: StorageEvent) {
    if (event.newValue) {
      switch (event.key) {
        case StorageKey.COLOR_MODE:
          const colorTheme = JSON.parse(event.newValue);
          this.store.dispatch(
            configActions.changeColorThemeFromLocalStorage({ colorTheme })
          );
          break;
        case StorageKey.VIEWER_TRANSCRIPT_FONTSIZE:
          const transcriptFontsize = JSON.parse(event.newValue);
          this.store.dispatch(
            viewerActions.updateSettings({ transcriptFontsize })
          );
          break;
        case StorageKey.CAPTIONS_COLOR:
          const captionsColor = JSON.parse(event.newValue);
          this.store.dispatch(viewerActions.updateSettings({ captionsColor }));
          break;
        case StorageKey.CAPTIONS_BACKGROUND_COLOR:
          const captionsBackgroundColor = JSON.parse(event.newValue);
          this.store.dispatch(
            viewerActions.updateSettings({ captionsBackgroundColor })
          );
          break;
        case StorageKey.CAPTIONS_FONTSIZE:
          const captionsFontsize = JSON.parse(event.newValue);
          this.store.dispatch(
            viewerActions.updateSettings({ captionsFontsize })
          );
          break;
        case StorageKey.CAPTIONS_POSITION:
          const captionsPosition = JSON.parse(event.newValue);
          this.store.dispatch(
            viewerActions.updateSettings({ captionsPosition })
          );
          break;

        case StorageKey.VIEWER_TRANSCRIPT_POSITION:
          const transcriptPosition = JSON.parse(event.newValue);
          this.store.dispatch(
            viewerActions.updateSettings({ transcriptPosition })
          );
          break;

        case StorageKey.VIEWER_SUBTITLES_ENABLED:
          const subtitlesEnabled = JSON.parse(event.newValue);
          this.store.dispatch(
            viewerActions.updateSettings({ subtitlesEnabled })
          );
          break;

        default:
          break;
      }
    }
  }
}
