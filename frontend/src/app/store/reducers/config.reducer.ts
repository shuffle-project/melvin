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

export interface ConfigState {
  language: PageLanguage;
  darkMode: boolean;

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
  darkMode: storage.getFromLocalStorage(StorageKey.DARK_MODE, false) as boolean,

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
    configActions.toggleDarkMode,
    configActions.toggleDarkModeFromViewer,
    (state) => ({
      ...state,
      darkMode: !state.darkMode,
    })
  ),

  on(configActions.changeLanguage, (state, { language }) => ({
    ...state,
    language,
  }))
);
