import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ViewerState } from '../reducers/viewer.reducer';

export const selectViewerState = createFeatureSelector<ViewerState>('viewer');

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

export const selectCaptionPosition = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.captionsPosition;
  }
);

export const selectBigVideo = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.viewerVideos.find((video) => video.id === state.bigVideoId);
  }
);

export const selectSmallVideos = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.viewerVideos?.filter((video) => video.id !== state.bigVideoId);
  }
);
