import { createReducer, on } from '@ngrx/store';
import {
  CaptionPositionOptions,
  ColorOptions,
  SizeOptions,
} from '../../routes/viewer/components/captions-settings-dialog/captions-settings-dialog.component';
import { ViewerVideo } from '../../routes/viewer/components/player/player.component';
import { TranscriptPosition } from '../../routes/viewer/viewer.interfaces';
import { TiptapCaption } from '../../services/api/entities/caption.entity';
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
  // captions: CaptionListEntity | null;
  tiptapCaptions: TiptapCaption[] | null;

  //SETTINGS
  transcriptFontsize: SizeOptions;
  transcriptPosition: TranscriptPosition;
  transcriptOnlyMode: boolean;
  captionsBackgroundColor: ColorOptions;
  captionsColor: ColorOptions;
  captionsFontsize: SizeOptions;
  captionsPosition: CaptionPositionOptions;
  currentSpeed: number;
  muted: boolean;
  volume: number;
  subtitlesEnabled: boolean;

  // TODO new names?
  viewerVideos: ViewerVideo[];
  bigVideoId: string;

  //
  loadingMediaIds: string[];
  isPlayingUser: boolean;
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
  // captions: null,
  tiptapCaptions: null,

  // viewer settings
  currentSpeed: 1,
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
  muted: storage.getFromLocalStorage(
    StorageKey.VIEWER_MEDIA_MUTED,
    false
  ) as boolean,
  volume: storage.getFromSessionStorage(
    StorageKey.VIEWER_MEDIA_VOLUME,
    1
  ) as number,
  subtitlesEnabled: storage.getFromLocalStorage(
    StorageKey.VIEWER_SUBTITLES_ENABLED,
    false
  ) as boolean,

  viewerVideos: [],
  bigVideoId: '',

  loadingMediaIds: [],
  isPlayingUser: false,
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
    return { ...state, tiptapCaptions: action.tiptapCaptions };
  }),

  // SETTINGS

  on(viewerActions.updateSettings, (state, action) => {
    return { ...state, ...action };
  }),

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
    viewerActions.changeTranscriptPositionControls,
    viewerActions.changeTranscriptPositionEmbed,
    viewerActions.changeTranscriptPositionForFullscreen,
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
  on(viewerActions.toggleSubtitles, (state) => {
    return { ...state, subtitlesEnabled: !state.subtitlesEnabled };
  }),
  on(viewerActions.changeVolume, (state, { newVolume: volume }) => {
    return { ...state, volume };
  }),
  on(viewerActions.toggleMute, (state) => {
    return { ...state, muted: !state.muted };
  }),
  on(viewerActions.changeSpeed, (state, { newSpeed: speed }) => {
    return { ...state, currentSpeed: speed };
  }),
  // videos
  on(viewerActions.findProjectMediaSuccess, (state, { media }) => {
    return {
      ...state,
      viewerVideos: media.videos.map((video) => ({
        ...video,
        shown: true,
      })),
      bigVideoId: media.videos[0].id,
    };
  }),
  on(viewerActions.switchToNewBigVideo, (state, { newBigVideoId }) => {
    return {
      ...state,
      viewerVideos: state.viewerVideos.map((video) => {
        return {
          ...video,
          shown: newBigVideoId === state.bigVideoId ? true : video.shown,
        };
      }),
      bigVideoId: newBigVideoId,
    };
  }),
  on(viewerActions.toggleShowVideo, (state, { id }) => {
    return {
      ...state,
      viewerVideos: state.viewerVideos.map((video) => {
        if (video.id !== id) {
          return { ...video };
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
  }),

  // media loading & playing
  on(viewerActions.playPauseUser, (state) => {
    return { ...state, isPlayingUser: !state.isPlayingUser };
  }),

  on(viewerActions.mediaLoading, (state, { id }) => {
    return { ...state, loadingMediaIds: [...state.loadingMediaIds, id] };
  }),
  on(viewerActions.mediaLoaded, (state, { id }) => {
    return {
      ...state,
      loadingMediaIds: state.loadingMediaIds.filter((obj) => obj !== id),
    };
  })
);
