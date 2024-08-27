import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FilterLanguageSet } from 'src/app/constants/filterLanguageSet.constant';
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

export const getSupportedASRLanguages = createSelector(
  configState,
  (state: ConfigState) => {
    const whisperLanguages = state.asrServices.filter(
      (service) => service.asrVendor === AsrVendors.WHISPER
    )[0]?.languages;
    const filterLanguageSet = FilterLanguageSet;
    const allLanguages = state.languages;

    return allLanguages.filter((language) => {
      return (
        !filterLanguageSet.has(language.code) &&
        whisperLanguages.some((l) => language.code.startsWith(l.code))
      );
    });
  }
);

// getSupportedASRLanguages
// ASR service von typ WHISPER suchen und languages mit den allgemeinen zusammenfiltern

// iso 639 liste nehmen
// {englishName, nativeName, code}
// en-US und en-GB unterstützen / erweitern
