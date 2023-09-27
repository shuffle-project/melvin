import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ConfigState } from '../reducers/config.reducer';

export const configState = createFeatureSelector<ConfigState>('config');

export const translationServiceConfig = createSelector(
  configState,
  (state: ConfigState) => state.translationServices
);

export const asrServiceConfig = createSelector(
  configState,
  (state: ConfigState) => state.asrServices
);

export const languagesConfig = createSelector(
  configState,
  (state: ConfigState) => state.languages
);

export const darkMode = createSelector(
  configState,
  (state: ConfigState) => state.darkMode
);
