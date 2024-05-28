import { HttpErrorResponse } from '@angular/common/http';
import { createAction, props } from '@ngrx/store';
import { ConfigEntity } from '../../services/api/entities/config.entity';
import { ColorTheme, PageLanguage } from '../reducers/config.reducer';

export const fetch = createAction('[HOME COMPONENT] Fetch inital configs');

export const fetchSuccess = createAction(
  '[CONFIG API] Fetch config success',
  props<{ configEntity: ConfigEntity }>()
);

export const fetchFailed = createAction(
  '[CONFIG API] Fetch config failure',
  props<{ error: HttpErrorResponse }>()
);

export const changeColorTheme = createAction(
  '[TODO] Change Color Mode',
  props<{ colorTheme: ColorTheme }>()
);

export const changeColorThemeViewer = createAction(
  '[VIEWER CONTROLS] Change Color Mode',
  props<{ colorTheme: ColorTheme }>()
);

export const changeLanguage = createAction(
  '[CONFIG EFFECTS] Change Language',
  props<{ language: PageLanguage }>()
);
