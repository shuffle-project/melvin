import { createReducer, on } from '@ngrx/store';
import {
  CaptionPositionOptions,
  ColorOptions,
  SizeOptions,
} from '../../routes/home/viewer/components/captions-settings-dialog/captions-settings-dialog.component';
import { ViewerVideo } from '../../routes/home/viewer/components/player/player.component';
import {
  TranscriptFontsize,
  TranscriptPosition,
} from '../../routes/home/viewer/viewer.interfaces';
import { VideoCategory } from '../../services/api/entities/project.entity';
import { StorageKey } from '../../services/storage/storage-key.enum';
import { StorageService } from '../../services/storage/storage.service';
import * as viewerActions from '../actions/viewer.actions';

const storage = new StorageService();

export interface ViewerState {
  transcriptEnabled: boolean;
  transcriptFontsize: TranscriptFontsize;
  transcriptPosition: TranscriptPosition;
  captionsBackgroundColor: ColorOptions;
  captionsColor: ColorOptions;
  captionsFontsize: SizeOptions;
  captionsPosition: CaptionPositionOptions;

  // TODO new names?
  viewerVideos: ViewerVideo[];
  bigVideoId: string;
}

export const initalState: ViewerState = {
  // viewer settings
  transcriptEnabled: storage.getFromLocalStorage(
    StorageKey.VIEWER_TRANSCRIPT_ENABLED,
    true
  ) as boolean,
  transcriptFontsize: storage.getFromLocalStorage(
    StorageKey.VIEWER_TRANSCRIPT_FONTSIZE,
    TranscriptFontsize.NORMAL
  ) as TranscriptFontsize,
  transcriptPosition: storage.getFromLocalStorage(
    StorageKey.VIEWER_TRANSCRIPT_POSITION,
    TranscriptPosition.RIGHT
  ) as TranscriptPosition,
  captionsBackgroundColor: storage.getFromLocalStorage(
    StorageKey.CAPTIONS_BACKGROUND_COLOR,
    ColorOptions.BLACK
  ) as ColorOptions,
  captionsColor: storage.getFromLocalStorage(
    StorageKey.CAPTIONS_COLOR,
    ColorOptions.WHITE
  ) as ColorOptions,
  captionsFontsize: storage.getFromLocalStorage(
    StorageKey.CAPTIONS_FONTSIZE,
    SizeOptions.MEDIUM
  ) as SizeOptions,
  captionsPosition: storage.getFromLocalStorage(
    StorageKey.CAPTIONS_POSITION,
    CaptionPositionOptions.OVER_VIDEO
  ) as CaptionPositionOptions,

  viewerVideos: [],
  bigVideoId: '',
};

export const viewerReducer = createReducer(
  initalState,

  on(viewerActions.changeTranscriptEnabled, (state, { transcriptEnabled }) => {
    return { ...state, transcriptEnabled };
  }),
  on(viewerActions.toggleTranscript, (state) => {
    return { ...state, transcriptEnabled: !state.transcriptEnabled };
  }),
  on(
    viewerActions.changeTranscriptFontsize,
    (state, { transcriptFontsize }) => {
      return { ...state, transcriptFontsize };
    }
  ),
  on(
    viewerActions.changeTranscriptPosition,
    (state, { transcriptPosition }) => {
      return { ...state, transcriptPosition };
    }
  ),
  on(
    viewerActions.changeCaptionsBackgroundColor,
    (state, { captionsBackgroundColor }) => {
      return { ...state, captionsBackgroundColor };
    }
  ),
  on(viewerActions.changeCaptionsColor, (state, { captionsColor }) => {
    return { ...state, captionsColor };
  }),
  on(viewerActions.changeCaptionsFontsize, (state, { captionsFontsize }) => {
    return { ...state, captionsFontsize };
  }),
  on(viewerActions.changeCaptionsPosition, (state, { captionsPosition }) => {
    return { ...state, captionsPosition };
  }),

  // videos
  on(viewerActions.initVideos, (state, { bigVideoId, viewerVideos }) => {
    return { ...state, viewerVideos, bigVideoId };
  }),
  on(viewerActions.switchToNewBigVideo, (state, { newBigVideoId }) => {
    return { ...state, bigVideoId: newBigVideoId };
  }),
  on(viewerActions.toggleShowVideo, (state, { id }) => {
    return {
      ...state,
      viewerVideos: state.viewerVideos.map((video) => {
        if (video.id !== id) {
          return video;
        }
        return { ...video, shown: !video.shown };
      }),
    };
  }),
  on(viewerActions.toggleSignLanguageVideos, (state) => {
    const shownSignLanguageVideos = state.viewerVideos.filter(
      (video) =>
        video.category === VideoCategory.SIGN_LANGUAGE && video.shown === true
    );

    return {
      ...state,
      viewerVideos: state.viewerVideos.map((video) => {
        if (video.category !== VideoCategory.SIGN_LANGUAGE) {
          return video;
        }
        if (shownSignLanguageVideos.length > 0) {
          return { ...video, shown: false };
        } else {
          return { ...video, shown: true };
        }
      }),
    };
  })
);
