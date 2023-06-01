import { createReducer, on } from '@ngrx/store';
import {
  ColorOptions,
  SizeOptions,
} from '../../routes/home/viewer/components/captions-settings-dialog/captions-settings-dialog.component';
import {
  TranscriptFontsize,
  TranscriptPosition,
  VideoArrangement,
} from '../../routes/home/viewer/viewer.interfaces';
import { StorageKey } from '../../services/storage/storage-key.enum';
import { StorageService } from '../../services/storage/storage.service';
import * as viewerActions from '../actions/viewer.actions';

const storage = new StorageService();

export interface ViewerState {
  videoArrangement: VideoArrangement;
  viewSelectionEnabled: boolean;
  transcriptEnabled: boolean;
  transcriptFontsize: TranscriptFontsize;
  transcriptPosition: TranscriptPosition;
  captionsBackgroundColor: ColorOptions;
  captionsColor: ColorOptions;
  captionsFontsize: SizeOptions;
}

export const initalState: ViewerState = {
  // viewer settings
  videoArrangement: storage.getFromSessionOrLocalStorage(
    StorageKey.VIEWER_VIDEO_ARRANGEMENT,
    VideoArrangement.CENTERED
  ) as VideoArrangement,
  viewSelectionEnabled: storage.getFromLocalStorage(
    StorageKey.VIEWER_VIEW_SELECTION_ENABLED,
    true
  ) as boolean,
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
};

export const viewerReducer = createReducer(
  initalState,

  on(viewerActions.changeVideoArrangement, (state, { videoArrangement }) => {
    return { ...state, videoArrangement };
  }),
  on(
    viewerActions.changeViewSelectionEnabled,
    (state, { viewSelectionEnabled }) => {
      return { ...state, viewSelectionEnabled };
    }
  ),
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
    return { ...state, captionsFontsize: captionsFontsize };
  })
);
