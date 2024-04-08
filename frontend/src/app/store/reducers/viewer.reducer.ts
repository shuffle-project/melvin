import { createReducer, on } from '@ngrx/store';
import {
  CaptionPositionOptions,
  ColorOptions,
  SizeOptions,
} from '../../routes/viewer/components/captions-settings-dialog/captions-settings-dialog.component';
import { ViewerVideo } from '../../routes/viewer/components/player/player.component';
import { TranscriptPosition } from '../../routes/viewer/viewer.interfaces';
import { CaptionListEntity } from '../../services/api/entities/caption-list.entity';
import {
  MediaCategory,
  ProjectEntity,
  ProjectMediaEntity,
} from '../../services/api/entities/project.entity';
import { TranscriptionEntity } from '../../services/api/entities/transcription.entity';
import { StorageKey } from '../../services/storage/storage-key.enum';
import { StorageService } from '../../services/storage/storage.service';
import * as viewerActions from '../actions/viewer.actions';

const storage = new StorageService();

export interface ViewerState {
  loading: boolean;
  tokenError: string | null;

  // DATA
  access_token: string | null;
  projectId: string | null;
  project: ProjectEntity | null;
  projectMedia: ProjectMediaEntity | null;
  transcriptions: TranscriptionEntity[];
  transcriptionId: string | null;
  captions: CaptionListEntity | null;

  //SETTINGS
  transcriptEnabled: boolean;
  transcriptFontsize: SizeOptions;
  transcriptPosition: TranscriptPosition;
  transcriptOnlyMode: boolean;
  captionsBackgroundColor: ColorOptions;
  captionsColor: ColorOptions;
  captionsFontsize: SizeOptions;
  captionsPosition: CaptionPositionOptions;

  // TODO new names?
  viewerVideos: ViewerVideo[];
  bigVideoId: string;
}

export const initalState: ViewerState = {
  loading: true,
  tokenError: null,

  // DATA
  access_token: null,
  projectId: null,
  project: null,
  projectMedia: null,
  transcriptions: [],
  transcriptionId: null,
  captions: null,

  // viewer settings
  transcriptEnabled: storage.getFromLocalStorage(
    StorageKey.VIEWER_TRANSCRIPT_ENABLED,
    true
  ) as boolean,
  transcriptFontsize: storage.getFromLocalStorage(
    StorageKey.VIEWER_TRANSCRIPT_FONTSIZE,
    SizeOptions.P100
  ) as SizeOptions,
  transcriptPosition: storage.getFromLocalStorage(
    StorageKey.VIEWER_TRANSCRIPT_POSITION,
    TranscriptPosition.RIGHT
  ) as TranscriptPosition,
  transcriptOnlyMode: false,
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
    SizeOptions.P100
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

  on(viewerActions.viewerLogin, (state, action) => {
    return { ...state, loading: true };
  }),
  on(viewerActions.viewerLoginSuccess, (state, action) => {
    return {
      ...state,
      access_token: action.viewerLoginEntity.token,
      projectId: action.viewerLoginEntity.projectId,
      loading: false,
      tokenError: null,
    };
  }),
  on(viewerActions.viewerLoginFail, (state, action) => {
    return { ...state, tokenError: action.error.message, loading: false };
  }),

  // DATA
  on(viewerActions.findProjectSuccess, (state, action) => {
    return { ...state, project: action.project };
  }),
  on(viewerActions.findProjectMediaSuccess, (state, action) => {
    return { ...state, projectMedia: action.media };
  }),
  on(viewerActions.findTranscriptionsSuccess, (state, action) => {
    return { ...state, transcriptions: action.transcriptions };
  }),
  on(viewerActions.changeTranscriptionId, (state, action) => {
    return { ...state, transcriptionId: action.transcriptionId };
  }),
  on(viewerActions.findCaptionsSuccess, (state, action) => {
    return { ...state, captions: action.captionListEntity };
  }),

  // SETTINGS

  on(viewerActions.changeTranscriptEnabled, (state, { transcriptEnabled }) => {
    return { ...state, transcriptEnabled };
  }),
  on(viewerActions.toggleTranscript, (state) => {
    return { ...state, transcriptEnabled: !state.transcriptEnabled };
  }),
  on(
    viewerActions.showTranscript,
    viewerActions.showTranscriptForFullscreen,
    (state) => {
      return { ...state, transcriptEnabled: true };
    }
  ),
  on(
    viewerActions.hideTranscript,
    viewerActions.hideTranscriptForFullscreen,
    (state) => {
      return { ...state, transcriptEnabled: false };
    }
  ),

  on(viewerActions.toggleTranscriptOnlyMode, (state) => {
    return { ...state, transcriptOnlyMode: !state.transcriptOnlyMode };
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
        video.category === MediaCategory.SIGN_LANGUAGE && video.shown === true
    );

    return {
      ...state,
      viewerVideos: state.viewerVideos.map((video) => {
        if (video.category !== MediaCategory.SIGN_LANGUAGE) {
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
