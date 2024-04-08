import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ViewerState } from '../reducers/viewer.reducer';

export const selectViewerState = createFeatureSelector<ViewerState>('viewer');

/**
 * LOGIN
 */
export const selectViewerToken = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.access_token;
  }
);
export const selectLoading = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.loading;
  }
);

export const selectViewerError = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.tokenError;
  }
);

/**
 * DATA
 */

export const vProject = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.project;
  }
);

export const vProjectMedia = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.projectMedia;
  }
);

export const vTranscriptions = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.transcriptions;
  }
);

export const vTranscription = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.transcriptionId
      ? state.transcriptions.find((obj) => obj.id === state.transcriptionId)
      : null;
  }
);

export const vTranscriptionId = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.transcriptionId;
  }
);

export const vAvailableSpeakers = createSelector(
  selectViewerState,
  (state: ViewerState) =>
    state.transcriptions.find((o) => o.id === state.transcriptionId)
      ?.speakers || []
);

export const vCaptions = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.captions?.captions || [];
  }
);

/**
 * SETTINGS
 */

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

export const selectTranscriptOnlyMode = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.transcriptOnlyMode;
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
