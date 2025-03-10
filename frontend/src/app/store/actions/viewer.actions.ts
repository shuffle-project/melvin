import { HttpErrorResponse } from '@angular/common/http';
import { createAction, props } from '@ngrx/store';

import {
  CaptionPositionOptions,
  ColorOptions,
  SizeOptions,
} from '../../routes/viewer/components/captions-settings-dialog/captions-settings-dialog.component';
import { TranscriptPosition } from '../../routes/viewer/viewer.interfaces';
import { ViewerLoginEntity } from '../../services/api/entities/auth.entity';
import { TiptapCaption } from '../../services/api/entities/caption.entity';
import {
  ProjectEntity,
  ProjectMediaEntity,
  ResolutionValue,
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
  props<{ tiptapCaptions: TiptapCaption[] }>()
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

export const changeTranscriptFontsize = createAction(
  '[ADJUST LAYOUT COMPONENT] Change Fontsize',
  props<{ transcriptFontsize: SizeOptions }>()
);

export const changeTranscriptPositionControls = createAction(
  '[CONTROLS COMPONENT] Change Transcript Position',
  props<{ transcriptPosition: TranscriptPosition }>()
);

export const changeTranscriptPositionEmbed = createAction(
  '[VIEWER COMPONENT] Change Transcript Position without saving it to localstorage',
  props<{ transcriptPosition: TranscriptPosition }>()
);

export const changeTranscriptPositionForFullscreen = createAction(
  '[VIEWER SERVICE] Change Transcript Position for fullscreen',
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

export const changeMaxResolution = createAction(
  '[CONTROLS COMPONENT] Change max resolution',
  props<{ newMaxResolution: ResolutionValue }>()
);

// media loading & playing

export const playPauseUser = createAction(
  '[CONTROLS COMPONENT] User toggle Play/Pause '
);

export const mediaLoadingSingle = createAction(
  '[VIEWER SERVICE] set loading started for one id',
  props<{ id: string }>()
);

export const mediaLoadingMultiple = createAction(
  '[VIEWER SERVICE] set loading started for multiple id',
  props<{ ids: string[] }>()
);

export const mediaLoaded = createAction(
  '[VIEWER SERVICE] set loading done for this id',
  props<{ id: string }>()
);

export const updateSettings = createAction(
  '[APP COMPONENT] update settings of viewer partially from localStorage event',
  props<{
    transcriptFontsize?: SizeOptions;
    captionsBackgroundColor?: ColorOptions;
    captionsColor?: ColorOptions;
    captionsFontsize?: SizeOptions;
    captionsPosition?: CaptionPositionOptions;
    transcriptPosition?: TranscriptPosition;
    subtitlesEnabled?: boolean;
  }>()
);
