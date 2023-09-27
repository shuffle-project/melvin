import { createReducer, on } from '@ngrx/store';
import {
  AsrServiceConfig,
  Language,
  TranslationServiceConfig,
} from '../../services/api/entities/config.entity';
import { StorageKey } from '../../services/storage/storage-key.enum';
import { StorageService } from '../../services/storage/storage.service';
import { fetchSuccess, toggleDarkMode } from '../actions/config.actions';

const storage = new StorageService();

export interface ConfigState {
  darkMode: boolean;

  //

  translationServices: TranslationServiceConfig[];
  asrServices: AsrServiceConfig[];
  languages: Language[];
}
export const initialState: ConfigState = {
  darkMode: storage.getFromLocalStorage(StorageKey.DARK_MODE, false) as boolean,

  //

  translationServices: [],
  asrServices: [],
  languages: [],
};

export const configReducer = createReducer(
  initialState,
  on(fetchSuccess, (state, action) => ({
    ...state,
    translationServices: action.configEntity.translationServices,
    asrServices: action.configEntity.asrServices,
    languages: action.configEntity.languages,
  })),

  on(toggleDarkMode, (state) => ({
    ...state,
    darkMode: !state.darkMode,
  }))
);
