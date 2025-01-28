import { HttpErrorResponse } from '@angular/common/http';
import { createAction, props } from '@ngrx/store';
import {
  ProjectEntity,
  ProjectMediaEntity,
} from '../../services/api/entities/project.entity';
import { WaveformData } from '../../services/api/entities/waveform-data.entity';
import { EditorUser } from '../reducers/editor.reducer';

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

export const updateActiveUsers = createAction(
  '[FROM WS] Overwrite active users from WS event',
  props<{
    users: EditorUser[];
  }>()
);

export const changeVolumeFromVideoComponent = createAction(
  '[VIDEO COMPONENT] Change Volume',
  props<{ volume: number }>()
);

export const toggleMutedFromEditor = createAction(
  '[VIDEO COMPONENT EDITOR] Toggle Muted'
);

export const toggleSubtitlesFromEditor = createAction(
  '[VIDEO COMPONENT] Toggle subtitles'
);

export const pauseFromVideoComponent = createAction(
  '[VIDEO COMPONENT] isPlaying on false'
);

export const findProjectFromEditor = createAction(
  '[EDITOR COMPONENT] Find project',
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

// project media
export const findProjectMedia = createAction(
  '[UPLOAD ADDITIONAL MEDIA COMPONENT] Find project media',
  props<{ projectId: string }>()
);

export const findProjectMediaSuccess = createAction(
  '[PROJECT API] Find project media success',
  props<{ media: ProjectMediaEntity }>()
);

export const findProjectMediaFail = createAction(
  '[PROJECT API] Find project media fail',
  props<{ error: HttpErrorResponse }>()
);

export const deleteProjectMedia = createAction(
  '[UPLOAD ADDITIONAL MEDIA COMPONENT] Delete project media',
  props<{ projectId: string; mediaId: string }>()
);

export const deleteProjectMediaSuccess = createAction(
  '[PROJECT API] Delete project media success',
  props<{ media: ProjectMediaEntity }>()
);

export const deleteProjectMediaFail = createAction(
  '[PROJECT API] Delete project media faiiled',
  props<{ error: HttpErrorResponse }>()
);

// waveform

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

export const changeSpellchecking = createAction(
  '[EDITOR SETTINGS COMPONENT] Change spellchecking ',
  props<{ spellchecking: boolean }>()
);

export const toggleShowUsernames = createAction(
  '[EDITOR SETTINGS COMPONENT] toggle show usernames'
);

/**
 * Media loading&playing stuff
 */

export const ePlayPauseUser = createAction(
  '[EDITOR COMPONENT] Play Pause User'
);
export const eMediaLodingSingle = createAction(
  '[EDITOR COMPONENT] Loading single media id',
  props<{ id: string }>()
);
export const eMediaLoadingMultiple = createAction(
  '[EDITOR COMPONENT] Loading multiple media ids',
  props<{ ids: string[] }>()
);
export const eMediaLoaded = createAction(
  '[EDITOR COMPONENT] Media loaded',
  props<{ id: string }>()
);
