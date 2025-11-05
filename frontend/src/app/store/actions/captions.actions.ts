import { HttpErrorResponse } from '@angular/common/http';
import { createAction, props } from '@ngrx/store';
import { CreateCaptionDto } from 'src/app/services/api/dto/create-caption.dto';
import { UpdateCaptionDto } from '../../services/api/dto/update-caption.dto';

// edit captions list

export const create = createAction(
  '[CAPTION_TIME COMPONENT] Add Caption from editor',
  props<{ captionDto: CreateCaptionDto }>()
);

export const createInitialCaption = createAction(
  '[CAPTIONS COMPONENT] Create initial empty caption'
);

export const createFailed = createAction(
  '[CAPTION API] Add caption failure',
  props<{ error: HttpErrorResponse }>()
);

// remove caption

export const remove = createAction(
  '[CAPTION COMPONENT] Remove Caption',
  props<{ removeCaptionId: string }>()
);

export const removeSuccess = createAction(
  '[CAPTION API] Remove Caption success'
  // props<{ removeCaptionId: string }>()
);

export const removeFailed = createAction(
  '[CAPTION API] Remove Caption failed',
  props<{ error: HttpErrorResponse }>()
);

export const removeFromWS = createAction(
  '[CAPTION WS] Remove Caption from WS',
  props<{ removeCaptionId: string }>()
);

// findAll captions

export const findAllFromEffect = createAction(
  '[CAPTION EFFECT] Fetch Captions of Transcription',
  props<{ transcriptionId: string }>()
);

export const findAllFail = createAction(
  '[CAPTION API] Fetch Captions of Transcription fail',
  props<{ error: HttpErrorResponse }>()
);

// update caption

export const update = createAction(
  '[CAPTION COMPONENT] Update Caption',
  props<{ id: string; updateDto: UpdateCaptionDto }>()
);

export const updateReducerOnly = createAction(
  '[WAVEFORM TIMELINE] Update Caption only in reducer',
  props<{ id: string; updateDto: UpdateCaptionDto }>()
);

export const updateEffectOnly = createAction(
  '[WAVEFORM TIMELINE] Update Caption only via effect',
  props<{ id: string; updateDto: UpdateCaptionDto }>()
);

export const updateAndUnselect = createAction(
  '[CAPTION COMPONENT] Update Caption and unselect caption',
  props<{ id: string; updateDto: UpdateCaptionDto }>()
);

export const updateFailed = createAction(
  '[CAPTION API] Update Caption failed',
  props<{ error: HttpErrorResponse }>()
);

// others

export const selectFromCaption = createAction(
  '[CAPTION COMPONENT] Select Caption',
  props<{ captionId: string }>()
);

export const unselectFromCaption = createAction(
  '[CAPTION COMPONENT] Unselect Caption'
);

export const selectFromEditor = createAction(
  '[EDITOR COMPONENT] Select Caption',
  props<{ captionId: string }>()
);
