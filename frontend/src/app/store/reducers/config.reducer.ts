import { createReducer, on } from '@ngrx/store';
import {
  AsrServiceConfig,
  Language,
  TranslationServiceConfig,
} from '../../services/api/entities/config.entity';
import { fetchSuccess } from '../actions/config.actions';

export interface ConfigState {
  translationServices: TranslationServiceConfig[];
  asrServices: AsrServiceConfig[];
  languages: Language[];
}
export const initialState: ConfigState = {
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
  }))
);
