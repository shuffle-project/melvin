import { enableProdMode, importProvidersFrom } from '@angular/core';
import * as dayjs from 'dayjs';
import 'dayjs/locale/de';
import 'dayjs/locale/en';
import * as calendar from 'dayjs/plugin/calendar';
import * as duration from 'dayjs/plugin/duration';
import * as relativeTime from 'dayjs/plugin/relativeTime';

import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideRouterStore } from '@ngrx/router-store';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import 'dayjs/locale/de';
import 'dayjs/locale/en';
import { AppComponent } from './app/app.component';
import { AppRoutes } from './app/app.routes';
import { DurationPipe } from './app/pipes/duration-pipe/duration.pipe';
import { FeatureEnabledPipe } from './app/pipes/feature-enabled-pipe/feature-enabled.pipe';
import { FormatDatePipe } from './app/pipes/format-date-pipe/format-date.pipe';
import { LanguageCodePipe } from './app/pipes/language-code-pipe/language-code.pipe';
import { MediaCategoryPipe } from './app/pipes/media-category-pipe/media-category.pipe';
import { ProjectStatusPipe } from './app/pipes/project-status-pipe/project-status.pipe';
import { TimeDifferencePipe } from './app/pipes/time-difference-pipe/time-difference.pipe';
import { WrittenOutLanguagePipe } from './app/pipes/written-out-language-pipe/written-out-language.pipe';
import { HighlightPipe } from './app/routes/home/viewer/components/highlight-pipe/highlight.pipe';
import {
  actionReducerMap,
  effectsList,
  metaReducers,
} from './app/store/app.state';
import { environment } from './environments/environment';

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(calendar);
dayjs.locale('en');

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(BrowserModule),
    provideRouter(AppRoutes),
    provideStore(actionReducerMap, {
      metaReducers,
      runtimeChecks: {
        strictStateImmutability: true,
        strictActionImmutability: true,
        strictStateSerializability: true,
        strictActionSerializability: false,
        strictActionWithinNgZone: true,
        strictActionTypeUniqueness: true,
      },
    }),
    provideEffects(effectsList),
    provideRouterStore(),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: environment.production,
      connectInZone: true,
    }),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),

    // moved form shared module
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },

    // Provide pipes
    // TODO as an alternative to this we could make pipes injectable providedin root
    DurationPipe,
    ProjectStatusPipe,
    FeatureEnabledPipe,
    FormatDatePipe,
    LanguageCodePipe,
    MediaCategoryPipe,
    TimeDifferencePipe,
    WrittenOutLanguagePipe,
    HighlightPipe,
  ],
}).catch((err) => console.error(err));
