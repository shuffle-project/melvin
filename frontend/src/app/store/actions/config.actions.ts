import { HttpErrorResponse } from '@angular/common/http';
import { createAction, props } from '@ngrx/store';
import { ConfigEntity } from '../../services/api/entities/config.entity';

export const fetch = createAction('[HOME COMPONENT] Fetch inital configs');

export const fetchSuccess = createAction(
  '[CONFIG API] Fetch config success',
  props<{ configEntity: ConfigEntity }>()
);

export const fetchFailed = createAction(
  '[CONFIG API] Fetch config failure',
  props<{ error: HttpErrorResponse }>()
);

export const toggleDarkMode = createAction(
  '[VIEWER COMPONENT] Toggle DarkMode'
);
