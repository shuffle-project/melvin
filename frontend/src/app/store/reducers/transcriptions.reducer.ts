import { createReducer, on } from '@ngrx/store';
import { TranscriptionEntity } from '../../services/api/entities/transcription.entity';
import * as transcriptionsActions from '../actions/transcriptions.actions';

export interface TranscriptionsState {
  transcriptionsList: TranscriptionEntity[];
  selectedTranscriptionId: string;
  loading: boolean;
}

export const initialState: TranscriptionsState = {
  transcriptionsList: [],
  selectedTranscriptionId: '',
  loading: false,
};

// TODO Listen/ Add functions to all the __fail actions
export const transcriptionsReducer = createReducer(
  initialState,
  on(
    transcriptionsActions.findAllFromEditor,
    transcriptionsActions.findAllFromEffect,
    (state, action) => {
      return {
        ...state,
        loading: true,
      };
    }
  ),
  on(transcriptionsActions.findAllSuccess, (state, action) => {
    return {
      ...state,
      transcriptionsList: action.transcriptions,
      selectedTranscriptionId: action.transcriptions[0].id,
      loading: false,
    };
  }),

  // TODO Finish after talk to decide where to save the selected transcription
  on(transcriptionsActions.findOneSuccess, (state, action) => ({
    ...state,
  })),

  on(
    transcriptionsActions.updateSuccess,
    transcriptionsActions.updateFromWS,
    (state, action) => ({
      ...state,
      transcriptionsList: state.transcriptionsList.map((item) => {
        return item.id !== action.updatedTranscription.id
          ? item
          : { ...item, ...action.updatedTranscription };
      }),
    })
  ),

  on(
    transcriptionsActions.removeSuccess,
    transcriptionsActions.removeFromWS,
    (state, action) => ({
      ...state,
      transcriptionsList: state.transcriptionsList.filter(
        (item) => item.id !== action.removedTranscriptionId
      ),
    })
  ),

  on(
    transcriptionsActions.createSuccess,
    transcriptionsActions.createFromWS,
    (state, action) => {
      let existsAlready = false;
      state.transcriptionsList.forEach((item) => {
        if (item.id === action.transcription.id) {
          existsAlready = true;
        }
      });

      return {
        ...state,
        transcriptionsList: existsAlready
          ? [...state.transcriptionsList]
          : [...state.transcriptionsList, action.transcription],
      };
    }
  ),
  on(transcriptionsActions.select, (state, action) => ({
    ...state,
    selectedTranscriptionId: action.transcriptionId,
  }))
);
