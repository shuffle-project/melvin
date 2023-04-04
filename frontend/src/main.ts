import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import * as dayjs from 'dayjs';
import 'dayjs/locale/de';
import * as calendar from 'dayjs/plugin/calendar';
import * as duration from 'dayjs/plugin/duration';
import * as relativeTime from 'dayjs/plugin/relativeTime';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(calendar);
dayjs.locale('de');

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
