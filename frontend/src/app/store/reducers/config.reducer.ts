import { createReducer, on } from '@ngrx/store';
import {
  AsrServiceConfig,
  Language,
  TranslationServiceConfig,
} from '../../services/api/entities/config.entity';
import { StorageKey } from '../../services/storage/storage-key.enum';
import { StorageService } from '../../services/storage/storage.service';
import * as configActions from '../actions/config.actions';

const storage = new StorageService();

export enum PageLanguage {
  DE_DE = 'de-DE',
  EN_US = 'en-US',
}

export enum ColorTheme {
  SYSTEM = 'system',
  DARK = 'dark',
  LIGHT = 'light',
}

export interface ConfigState {
  language: PageLanguage;
  colorTheme: ColorTheme;

  //

  translationServices: TranslationServiceConfig[];
  asrServices: AsrServiceConfig[];
  languages: Language[];
}
export const initialState: ConfigState = {
  language: storage.getFromLocalStorage(
    StorageKey.LANGUAGE_SETTING,
    PageLanguage.EN_US
  ) as PageLanguage,
  colorTheme: storage.getFromLocalStorage(
    StorageKey.COLOR_MODE,
    ColorTheme.LIGHT
  ) as ColorTheme,

  //

  translationServices: [],
  asrServices: [],
  languages: [],
};

export const configReducer = createReducer(
  initialState,
  on(configActions.fetchSuccess, (state, action) => ({
    ...state,
    translationServices: action.configEntity.translationServices,
    asrServices: action.configEntity.asrServices,
    languages: action.configEntity.languages,
  })),

  on(
    configActions.changeColorTheme,
    configActions.changeColorThemeViewer,
    (state, action) => ({
      ...state,
      colorTheme: action.colorTheme,
    })
  ),

  on(configActions.changeLanguage, (state, { language }) => ({
    ...state,
    language,
  }))
);
