import { HttpErrorResponse } from '@angular/common/http';
import { createAction, props } from '@ngrx/store';
import { EditorUserColor } from 'src/app/constants/editor.constants';
import { ProjectEntity } from '../../services/api/entities/project.entity';
import { WaveformData } from '../../services/api/entities/waveform-data.entity';

export const playFromCaption = createAction(
  '[CAPTION COMPONENT] Start playing'
);

export const togglePlayPauseFromEditor = createAction(
  '[EDITOR COMPONENT] Toggle Play Pause'
);

export const togglePlayPauseFromVideo = createAction(
  '[VIDEO COMPONENT] Toggle Play Pause'
);

export const playFromMediaService = createAction(
  '[MEDIA SERVICE] isPlaying on true'
);

export const backToLive = createAction('[EDITOR COMPONENT] Back to live');

export const changeSpeedFromEditor = createAction(
  '[VIDEO COMPONENT] Change Speed',
  props<{ speed: number }>()
);
export const changeSpeedFromViewer = createAction(
  '[VIEWER PLAYER COMPONENT] Change Speed',
  props<{ speed: number }>()
);

export const updateActiveUsers = createAction(
  '[FROM WS] Overwrite active users from WS event',
  props<{ activeUsers: { id: string; color: EditorUserColor }[] }>()
);

export const changeVolumeFromVideoComponent = createAction(
  '[VIDEO COMPONENT] Change Volume',
  props<{ volume: number }>()
);

export const changeVolumeFromViewerComponent = createAction(
  '[VIEWER PLAYER COMPONENT] Change Volume',
  props<{ volume: number }>()
);

export const toggleVolumeFromVideoComponent = createAction(
  '[VIDEO COMPONENT] Toggle Volume'
);

export const toggleSubtitlesFromEditor = createAction(
  '[VIDEO COMPONENT] Toggle subtitles'
);

export const toggleSubtitlesFromViewer = createAction(
  '[VIEWER VIDEO COMPONENT] Toggle subtitles'
);

export const pauseFromVideoComponent = createAction(
  '[VIDEO COMPONENT] isPlaying on false'
);

export const findProjectFromEditor = createAction(
  '[EDITOR COMPONENT] Find project',
  props<{ projectId: string }>()
);

export const findProjectFromViewer = createAction(
  '[VIEWER COMPONENT] Find project',
  props<{ projectId: string }>()
);

export const findProjectSuccess = createAction(
  '[PROJECT API] Find project success',
  props<{ project: ProjectEntity }>()
);

export const findProjectFail = createAction(
  '[PROJECT API] Find project fail',
  props<{ error: HttpErrorResponse }>()
);

export const getWaveform = createAction(
  '[PROJECT API] Get waveform',
  props<{ projectId: string }>()
);

export const getWaveformSuccess = createAction(
  '[PROJECT API] Get waveform success',
  props<WaveformData>()
);

export const getWaveformFail = createAction(
  '[PROJECT API] Get waveform fail',
  props<{ error: HttpErrorResponse }>()
);

export const updateWaveformFromWS = createAction(
  '[FROM WS] Update waveform',
  props<{ projectId: string; values: number[] }>()
);

export const setCaptionTextValidationEnabled = createAction(
  '[EDITOR COMPONENT] Set caption text validation enabled',
  props<{ enabled: boolean }>()
);

export const resetEditorState = createAction(
  '[EDITOR COMPONENT] Clear editor data'
);
