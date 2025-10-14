import { HttpErrorResponse } from '@angular/common/http';
import { createAction, props } from '@ngrx/store';
import { CreateTranscriptionDto } from 'src/app/services/api/dto/create-transcription.dto';
import { UpdateSpeakerDto } from 'src/app/services/api/dto/update-speaker.dto';
import { UpdateTranscriptionDto } from 'src/app/services/api/dto/update-transcription.dto';
import { CreateSpeakersDto } from '../../services/api/dto/create-speakers.dto';
import {
  SubtitleFormat,
  TranscriptionEntity,
} from '../../services/api/entities/transcription.entity';

export const findAllFromEditor = createAction(
  '[EDITOR COMPONENT] Fetch all Transcriptions of Project',
  props<{ projectId: string }>()
);

export const findAllFromEffect = createAction(
  '[TRANSCRIPTION EFFECT] Fetch all Transcriptions of Project',
  props<{ projectId: string }>()
);

export const changeTranscriptionId = createAction(
  '[EDITOR COMPONENT] set transcription id',
  props<{ transcriptionId: string }>()
);

export const findAllSuccess = createAction(
  '[TRANSCRIPTION API] Fetch all Transcriptions of Project success',
  props<{
    transcriptions: TranscriptionEntity[];
    selectedTranscriptionId?: string;
  }>()
);

export const findAllFail = createAction(
  '[TRANSCRIPTION EFFECTS] Fetch all Transcriptions of Project fail',
  props<{ error: HttpErrorResponse }>()
);

export const findOne = createAction(
  '[EDITOR COMPONENT] Find one transcription',
  props<{ transcriptionId: string }>()
);

export const findOneSuccess = createAction(
  '[TRANSCRIPTION API] Find one transcription success',
  props<{ transcription: TranscriptionEntity }>()
);

export const findOneFail = createAction(
  '[TRANSCRIPTION API] Find one transcription fail',
  props<{ error: HttpErrorResponse }>()
);

export const create = createAction(
  '[EDITOR COMPONENT] Create new transcription',
  props<{ newTranscription: CreateTranscriptionDto }>()
);

export const createSuccess = createAction(
  '[TRANSCRIPTION API] Create new transcription success',
  props<{ transcription: TranscriptionEntity }>()
);

export const createFromWS = createAction(
  '[TRANSCRIPTION WS] Create new transcription from WebSocket',
  props<{ transcription: TranscriptionEntity }>()
);

export const createFail = createAction(
  '[TRANSCRIPTION API] Create new transcription fail',
  props<{ error: HttpErrorResponse }>()
);

export const updateFromEditor = createAction(
  '[EDITOR COMPONENT] Update transcription',
  props<{ transcriptionId: string; transcription: UpdateTranscriptionDto }>()
);

export const createSpeakers = createAction(
  '[EDIT SPEAKER MODAL] Create speakers in transcription',
  props<{ transcriptionId: string; createSpeakersDto: CreateSpeakersDto }>()
);

export const updateSpeaker = createAction(
  '[EDIT SPEAKER MODAL] Update speaker in transcription',
  props<{
    transcriptionId: string;
    speakerId: string;
    updateSpeakerDto: UpdateSpeakerDto;
  }>()
);

export const removeSpeaker = createAction(
  '[EDIT SPEAKER MODAL] Remove speaker from transcription',
  props<{ transcriptionId: string; speakerId: string }>()
);

export const updateSuccess = createAction(
  '[TRANSCRIPTION API] Update transcription success',
  props<{ updatedTranscription: TranscriptionEntity }>()
);

export const updateFromWS = createAction(
  '[TRANSCRIPTION WS] Update transcription from WebSocket',
  props<{ updatedTranscription: TranscriptionEntity }>()
);

export const updateFail = createAction(
  '[TRANSCRIPTION API] Update transcription fail',
  props<{ error: HttpErrorResponse }>()
);

export const removeFromEditor = createAction(
  '[EDITOR COMPONENT] Remove transcription',
  props<{ transcriptionId: string }>()
);

export const removeSuccess = createAction(
  '[TRANSCRIPTION API] Remove transcription success',
  props<{ removedTranscriptionId: string }>()
);

export const removeFromWS = createAction(
  '[TRANSCRIPTION WS] Remove trancription from WS',
  props<{ removedTranscriptionId: string }>()
);

export const removeFail = createAction(
  '[TRANSCRIPTION API] Remove transcription fail',
  props<{ error: HttpErrorResponse }>()
);

export const selectFromEditor = createAction(
  '[EDITOR COMPONENT] Set transcription id',
  props<{ transcriptionId: string }>()
);

export const selectFromViewer = createAction(
  '[VIEWER PLAYER COMPONENT] Set transcription id',
  props<{ transcriptionId: string }>()
);

export const downloadSubtitles = createAction(
  '[EDITOR COMPONENT] Start download subtitles in a format',
  props<{ transcriptionId: string; format: SubtitleFormat }>()
);

export const downloadTranscript = createAction(
  '[EDITOR COMPONENT] Download transcript as txt',
  props<{ transcriptionId: string }>()
);
