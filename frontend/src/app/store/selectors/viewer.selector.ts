import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TranscriptPosition } from '../../routes/viewer/viewer.interfaces';
import { ViewerState } from '../reducers/viewer.reducer';

export const selectViewerState = createFeatureSelector<ViewerState>('viewer');

/**
 * LOGIN
 */
export const vAccessToken = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.access_token;
  }
);
export const vLoginLoading = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.loading;
  }
);

export const vLoginError = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.tokenError;
  }
);

/**
 * media loading & playing
 */
export const vIsPlayingUser = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.isPlayingUser;
  }
);

export const vCanPlay = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.loadingMediaIds.length === 0;
  }
);

export const vIsPlayingMedia = createSelector(
  vCanPlay,
  vIsPlayingUser,
  (canPlay: boolean, isPlayingUser: boolean) => {
    return canPlay && isPlayingUser;
  }
);

export const vShowLoadingSpinner = createSelector(
  vCanPlay,
  vIsPlayingUser,
  (canPlay: boolean, isPlayingUser: boolean) => {
    return !canPlay && isPlayingUser;
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
    return state.tiptapCaptions || [];
  }
);

/**
 * SETTINGS
 */

export const vTranscriptEnabled = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.transcriptPosition !== TranscriptPosition.OFF;
  }
);
export const vTranscriptFontsize = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.transcriptFontsize;
  }
);
export const vTranscriptPosition = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.transcriptPosition;
  }
);

export const vTranscriptOnly = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.transcriptOnlyMode;
  }
);

export const vCaptionsBackgroundColor = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.captionsBackgroundColor;
  }
);

export const vCaptionsColor = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.captionsColor;
  }
);

export const vCaptionFontsize = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.captionsFontsize;
  }
);

export const vCaptionPosition = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.captionsPosition;
  }
);

export const vViewerVideos = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.viewerVideos;
  }
);

export const vBigVideo = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.viewerVideos.find((video) => video.id === state.bigVideoId);
  }
);

export const vVolume = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.volume;
  }
);

export const vMuted = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.muted;
  }
);

export const vSubtitlesEnabled = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.subtitlesEnabled;
  }
);

export const vCurrentSpeed = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.currentSpeed;
  }
);

export const vMaxResolution = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.maxResolution;
  }
);
