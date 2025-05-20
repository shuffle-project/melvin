import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AsrVendors } from 'src/app/services/api/dto/create-transcription.dto';
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

export const colorTheme = createSelector(
  configState,
  (state: ConfigState) => state.colorTheme
);

export const language = createSelector(
  configState,
  (state: ConfigState) => state.language
);

export const isInitialized = createSelector(
  configState,
  (state: ConfigState) => state.isInitialized
);

export const getSupportedASRLanguages = createSelector(
  configState,
  (state: ConfigState) => {
    const whisperLanguages = state.asrServices.filter(
      (service) => service.asrVendor === AsrVendors.WHISPER
    )[0]?.languages;
    const allLanguages = state.languages;

    return allLanguages.filter((language) => {
      return whisperLanguages.some(
        (l) =>
          language.code === l.code || language.code.startsWith(l.code + '-')
      );
    });
  }
);

export const getSupportedTranslationLanguages = createSelector(
  configState,
  (state: ConfigState) => {
    const translationService = state.translationServices.filter(
      (s) => s.fullName === 'Melvin'
    );

    const translationLanguages = translationService[0].languages;
    const allLanguages = state.languages;

    return allLanguages.filter((language) => {
      return translationLanguages.some(
        (l) =>
          language.code === l.code || language.code.startsWith(l.code + '-')
      );
    });
  }
);
