import { createAction, props } from '@ngrx/store';
import {
  ColorOptions,
  SizeOptions,
} from '../../routes/home/viewer/components/captions-settings-dialog/captions-settings-dialog.component';
import {
  TranscriptFontsize,
  TranscriptPosition,
  VideoArrangement,
} from '../../routes/home/viewer/viewer.interfaces';

export const changeVideoArrangement = createAction(
  '[ADJUST LAYOUT COMPONENT] Change Video Arrangement',
  props<{ videoArrangement: VideoArrangement }>()
);

export const changeAdditionalVideo = createAction(
  '[VIEW SELECTION COMPONENT] Change choosen additional Video',
  props<{ choosenAdditionalVideo: number }>()
);

export const changeViewSelectionEnabled = createAction(
  '[ADJUST LAYOUT COMPONENT] Change view selection Enabled',
  props<{ viewSelectionEnabled: boolean }>()
);

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
