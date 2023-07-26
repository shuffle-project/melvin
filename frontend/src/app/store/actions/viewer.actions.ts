import { createAction, props } from '@ngrx/store';
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

export const changeTranscriptEnabled = createAction(
  '[ADJUST LAYOUT COMPONENT] Change Transcript Enabled',
  props<{ transcriptEnabled: boolean }>()
);
export const toggleTranscript = createAction(
  '[VIEWER VIDEO COMPONENT] Toggle Transcript enabled'
);

export const changeTranscriptFontsize = createAction(
  '[ADJUST LAYOUT COMPONENT] Change Fontsize',
  props<{ transcriptFontsize: TranscriptFontsize }>()
);

export const changeTranscriptPosition = createAction(
  '[ADJUST LAYOUT COMPONENT] Change Transcript Position',
  props<{ transcriptPosition: TranscriptPosition }>()
);

export const changeCaptionsBackgroundColor = createAction(
  '[CAPTIONS SETTINGS DIALOG] Change captions background color',
  props<{ captionsBackgroundColor: ColorOptions }>()
);
export const changeCaptionsColor = createAction(
  '[CAPTIONS SETTINGS DIALOG] Change captions color',
  props<{ captionsColor: ColorOptions }>()
);
export const changeCaptionsFontsize = createAction(
  '[CAPTIONS SETTINGS DIALOG] Change captions fontsize',
  props<{ captionsFontsize: SizeOptions }>()
);

export const changeCaptionsPosition = createAction(
  '[CAPTIONS SETTINGS DIALOG] Change captions position',
  props<{ captionsPosition: CaptionPositionOptions }>()
);

export const initVideos = createAction(
  '[PLAYER COMPONENT] Add initial videos',
  props<{ viewerVideos: ViewerVideo[]; bigVideoId: string }>()
);

export const switchToNewBigVideo = createAction(
  '[PLAYER COMPONENT] Switch given Video to new big video',
  props<{ newBigVideoId: string }>()
);

export const toggleShowVideo = createAction(
  '[PLAYER COMPONENT] Toggle show video',
  props<{ id: string }>()
);
