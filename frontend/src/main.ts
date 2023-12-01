import { enableProdMode, importProvidersFrom } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import * as dayjs from 'dayjs';
import 'dayjs/locale/de';
import * as calendar from 'dayjs/plugin/calendar';
import * as duration from 'dayjs/plugin/duration';
import * as relativeTime from 'dayjs/plugin/relativeTime';

import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { AlertModule } from './app/services/alert/alert.module';
import { SharedModule } from './app/modules/shared/shared.module';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { environment as environment_1 } from 'src/environments/environment';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EffectsModule } from '@ngrx/effects';
import { actionReducerMap, metaReducers, effectsList } from './app/store/app.state';
import { StoreModule } from '@ngrx/store';
import { withInterceptorsFromDi, provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app/app-routing.module';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { DurationPipe } from './app/pipes/duration-pipe/duration.pipe';

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(calendar);
dayjs.locale('de');

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(BrowserModule, AppRoutingModule, StoreModule.forRoot(actionReducerMap, {
            metaReducers,
            runtimeChecks: {
                strictStateImmutability: true,
                strictActionImmutability: true,
                strictStateSerializability: true,
                strictActionSerializability: false,
                strictActionWithinNgZone: true,
                strictActionTypeUniqueness: true,
            },
        }), EffectsModule.forRoot(effectsList), StoreDevtoolsModule.instrument({
            maxAge: 25,
            logOnly: environment.production,
            connectInZone: true,
        }), StoreRouterConnectingModule.forRoot(), SharedModule, AlertModule),
        DurationPipe,
        provideAnimations(),
        provideHttpClient(withInterceptorsFromDi()),
    ]
})
  .catch((err) => console.error(err));
