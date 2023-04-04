import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TranscriptionsState } from '../reducers/transcriptions.reducer';

export const selectTranscriptionsState =
  createFeatureSelector<TranscriptionsState>('transcriptions');

export const selectTranscriptionList = createSelector(
  selectTranscriptionsState,
  (state: TranscriptionsState) => state.transcriptionsList
);

export const selectTranscriptionId = createSelector(
  selectTranscriptionsState,
  (state: TranscriptionsState) => state.selectedTranscriptionId
);

export const selectLoading = createSelector(
  selectTranscriptionsState,
  (state: TranscriptionsState) => state.loading
);

export const selectAvailableSpeakers = createSelector(
  selectTranscriptionsState,
  (state: TranscriptionsState) =>
    state.transcriptionsList.find((o) => o.id === state.selectedTranscriptionId)
      ?.speakers || []
);
