import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ViewerState } from '../reducers/viewer.reducer';

export const selectViewerState = createFeatureSelector<ViewerState>('viewer');

export const selectVideoArrangement = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.videoArrangement;
  }
);

export const selectChoosenAdditionalVideo = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.choosenAdditionalVideo;
  }
);
export const selectViewSelectionEnabled = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.viewSelectionEnabled;
  }
);
export const selectTranscriptEnabled = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.transcriptEnabled;
  }
);
export const selectTranscriptFontsize = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.transcriptFontsize;
  }
);
export const selectTranscriptPosition = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.transcriptPosition;
  }
);

export const selectCaptionsBackgroundColor = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.captionsBackgroundColor;
  }
);

export const selectCaptionsColor = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.captionsColor;
  }
);

export const selectCaptionFontsize = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.captionsFontsize;
  }
);
