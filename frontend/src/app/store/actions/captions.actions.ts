import { HttpErrorResponse } from '@angular/common/http';
import { createAction, props } from '@ngrx/store';
import { CreateCaptionDto } from 'src/app/services/api/dto/create-caption.dto';
import { UpdateCaptionDto } from '../../services/api/dto/update-caption.dto';
import { CaptionListEntity } from '../../services/api/entities/caption-list.entity';
import { CaptionEntity } from '../../services/api/entities/caption.entity';

// edit captions list

export const create = createAction(
  '[CAPTION_TIME COMPONENT] Add Caption from editor',
  props<{ captionDto: CreateCaptionDto }>()
);

export const createSuccess = createAction(
  '[CAPTION API] Add caption success',
  props<{ newCaption: CaptionEntity }>()
);

export const createFromWS = createAction(
  '[CAPTION WS] Add caption from WebSocket',
  props<{ newCaption: CaptionEntity }>()
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

export const findAllSuccess = createAction(
  '[CAPTION API] Fetch Captions of Transcription success',
  props<{ captionListEntity: CaptionListEntity }>()
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

export const updateSuccess = createAction(
  '[CAPTION API] Update Caption success',
  props<{ updateCaption: CaptionEntity }>()
);

export const updateFailed = createAction(
  '[CAPTION API] Update Caption failed',
  props<{ error: HttpErrorResponse }>()
);

export const updateFromWS = createAction(
  '[CAPTION WS] Caption updated from WS',
  props<{ updateCaption: CaptionEntity }>()
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
