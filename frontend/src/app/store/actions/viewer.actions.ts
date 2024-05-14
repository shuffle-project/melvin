import { HttpErrorResponse } from '@angular/common/http';
import { createAction, props } from '@ngrx/store';

import {
  CaptionPositionOptions,
  ColorOptions,
  SizeOptions,
} from '../../routes/viewer/components/captions-settings-dialog/captions-settings-dialog.component';
import { TranscriptPosition } from '../../routes/viewer/viewer.interfaces';
import { ViewerLoginEntity } from '../../services/api/entities/auth.entity';
import { CaptionListEntity } from '../../services/api/entities/caption-list.entity';
import {
  ProjectEntity,
  ProjectMediaEntity,
} from '../../services/api/entities/project.entity';
import { TranscriptionEntity } from '../../services/api/entities/transcription.entity';

/**
 * INIT
 */

// viewer login
export const viewerLogin = createAction(
  '[VIEWER-WRAPPER COMPONENT] viewer login',
  props<{ token: string }>()
);

export const viewerLoginSuccess = createAction(
  '[AUTH API] viewer login success',
  props<{ viewerLoginEntity: ViewerLoginEntity }>()
);

export const viewerLoginFail = createAction(
  '[AUTH API] viewer login fail',
  props<{ error: HttpErrorResponse }>()
);

/**
 * DATA
 */

// find project
export const findProject = createAction(
  '[VIEWER EFFECTS] Find project',
  props<{ projectId: string }>()
);

export const findProjectSuccess = createAction(
  '[VIEWER EFFECTS API] Find project success',
  props<{ project: ProjectEntity }>()
);

export const findProjectFail = createAction(
  '[VIEWER EFFECTS API] Find project fail',
  props<{ error: HttpErrorResponse }>()
);

// find project media
export const findProjectMedia = createAction(
  '[VIEWER EFFECTS] Find project media',
  props<{ projectId: string }>()
);

export const findProjectMediaSuccess = createAction(
  '[VIEWER EFFECTS API] Find project media success',
  props<{ media: ProjectMediaEntity }>()
);

export const findProjectMediaFail = createAction(
  '[VIEWER EFFECTS API] Find project media fail',
  props<{ error: HttpErrorResponse }>()
);

// findOneTranscription ?

// findAllTranscription
export const findTranscriptions = createAction(
  '[VIEWER EFFECTS] Fetch all Transcriptions of Project',
  props<{ projectId: string }>()
);

export const findTranscriptionsSuccess = createAction(
  '[VIEWER EFFECTS API] Fetch all Transcriptions of Project success',
  props<{ transcriptions: TranscriptionEntity[] }>()
);

export const findTranscriptionsFail = createAction(
  '[VIEWER EFFECTS API] Fetch all Transcriptions of Project fail',
  props<{ error: HttpErrorResponse }>()
);

export const changeTranscriptionId = createAction(
  '[VIEWER CONTROLS] Change transcriptionId',
  props<{ transcriptionId: string }>()
);

// findAll captions
export const findCaptions = createAction(
  '[VIEWER EFFECTS] Fetch Captions of Transcription',
  props<{ transcriptionId: string }>()
);

export const findCaptionsSuccess = createAction(
  '[VIEWER EFFECTS API] Fetch Captions of Transcription success',
  props<{ captionListEntity: CaptionListEntity }>()
);

export const findCaptionsFail = createAction(
  '[VIEWER EFFECTS API] Fetch Captions of Transcription fail',
  props<{ error: HttpErrorResponse }>()
);

/**
 * SETTINGS
 */

export const toggleTranscriptOnlyMode = createAction(
  '[VIEWER VIDEO COMPONENT] Toggle Transcript ony mode'
);

export const hideTranscript = createAction(
  '[CONTROLS COMPONENT] Hide Transcript'
);
export const showTranscript = createAction(
  '[CONTROLS COMPONENT] Show Transcript'
);

export const hideTranscriptForFullscreen = createAction(
  '[VIEWER SERVICE] Hide Transcript'
);
export const showTranscriptForFullscreen = createAction(
  '[VIEWER SERVICE] Show Transcript'
);

export const changeTranscriptFontsize = createAction(
  '[ADJUST LAYOUT COMPONENT] Change Fontsize',
  props<{ transcriptFontsize: SizeOptions }>()
);

export const changeTranscriptPosition = createAction(
  '[CONTROLS COMPONENT] Change Transcript Position',
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

export const switchToNewBigVideo = createAction(
  '[PLAYER COMPONENT] Switch given Video to new big video',
  props<{ newBigVideoId: string }>()
);

export const toggleShowVideo = createAction(
  '[PLAYER COMPONENT] Toggle show video',
  props<{ id: string }>()
);

export const toggleSignLanguageVideos = createAction(
  '[CONTROLS COMPONENT] Toggle show sign langauge video'
);

export const toggleSubtitles = createAction(
  '[CONTROLS COMPONENT] Toggle subtitles'
);

export const toggleMute = createAction('[CONTROLS COMPONENT] Toggle mute');

export const changeVolume = createAction(
  '[CONTROLS COMPONENT] Change volume',
  props<{ newVolume: number }>()
);

export const changeSpeed = createAction(
  '[CONTROLS COMPONENT] Change speed',
  props<{ newSpeed: number }>()
);
