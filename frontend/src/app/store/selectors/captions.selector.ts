import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CaptionEntity } from '../../services/api/entities/caption.entity';
import { CaptionsState } from '../reducers/captions.reducer';

const placeholderCaption: CaptionEntity = {
  id: '',
  createdAt: '',
  updatedAt: '',
  project: '',
  transcription: '',
  updatedBy: '',
  wasManuallyEdited: false,
  initialText: '',
  text: '',
  start: -1,
  end: Number.POSITIVE_INFINITY,
  speakerId: '',
  lockedBy: null,
  status: null,
  history: [],
};

export const selectCaptionsState =
  createFeatureSelector<CaptionsState>('captions');

export const selectCaptions = createSelector(
  selectCaptionsState,
  (state: CaptionsState) => state.captionsList
);

export const selectSelectedCaption = createSelector(
  //todo default?
  selectCaptionsState,
  (state: CaptionsState) =>
    state.captionsList.find((item) => item.id === state.selectedCaptionId) ||
    placeholderCaption
);

export const selectLoading = createSelector(
  selectCaptionsState,
  (state: CaptionsState) => state.loading
);
