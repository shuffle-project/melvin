import { createReducer, on } from '@ngrx/store';
import { CaptionEntity } from '../../services/api/entities/caption.entity';
import * as captionsActions from '../actions/captions.actions';
import * as transcriptionsActions from '../actions/transcriptions.actions';

export interface CaptionsState {
  captionsList: CaptionEntity[];
  selectedCaptionId: string | null;
  loading: boolean;
}

export const initalState: CaptionsState = {
  captionsList: [],
  selectedCaptionId: '',
  loading: true,
};

export const captionsReducer = createReducer(
  initalState,
  on(
    // captionsActions.createSuccess,
    captionsActions.createFromWS,
    (state, { newCaption }) => {
      let newCaptionList: CaptionEntity[] = [];
      let indexToSplit = state.captionsList.findIndex(
        (caption) => newCaption.start < caption.start
      );

      if (indexToSplit === -1) {
        newCaptionList = [...state.captionsList, newCaption];
      } else {
        let firstHalf = state.captionsList.slice(0, indexToSplit);
        let secondHalf = state.captionsList.slice(indexToSplit);
        newCaptionList = [...firstHalf, newCaption, ...secondHalf];
      }

      return {
        ...state,
        captionsList: newCaptionList,
      };
    }
  ),
  on(
    captionsActions.remove,
    captionsActions.removeFromWS,
    (state, { removeCaptionId }) => ({
      ...state,
      captionsList: state.captionsList.filter(
        (caption) => caption.id !== removeCaptionId
      ),
    })
  ),

  // modify one single caption by id functions
  // update with CaptionEntity (from server)
  on(
    captionsActions.updateFromWS,
    captionsActions.updateSuccess,
    (state, { updateCaption }) => ({
      ...state,
      captionsList: state.captionsList.map((item) => {
        if (item.id !== updateCaption.id) {
          return item;
        }

        // keep the newer item
        if (updateCaption.updatedAt >= item.updatedAt) {
          return {
            ...item,
            ...updateCaption,
          };
        } else {
          return item;
        }
      }),
    })
  ),
  // update with UpdateDTO (from client)
  on(
    captionsActions.update,
    captionsActions.updateReducerOnly,
    (state, { id, updateDto }) => ({
      ...state,
      captionsList: state.captionsList.map((item) => {
        if (item.id !== id) {
          return item;
        }
        return {
          ...item,
          ...updateDto,
        };
      }),
    })
  ),
  on(captionsActions.updateAndUnselect, (state, { id, updateDto }) => ({
    ...state,
    captionsList: state.captionsList.map((item) => {
      if (item.id !== id) {
        return item;
      }
      return {
        ...item,
        ...updateDto,
      };
    }),
    selectedCaptionId: null,
  })),

  // selected Caption functions
  on(
    captionsActions.selectFromCaption,
    captionsActions.selectFromEditor,
    (state, { captionId }) => ({
      ...state,
      selectedCaptionId: captionId,
    })
  ),

  // selected Caption functions
  on(captionsActions.unselectFromCaption, (state) => ({
    ...state,
    selectedCaptionId: null,
  })),

  // retrieve Data from API functions

  on(
    captionsActions.findAllFromEffect,
    transcriptionsActions.selectFromEditor,
    transcriptionsActions.selectFromViewer,
    (state, action) => {
      return {
        ...state,
        loading: true,
      };
    }
  ),
  on(captionsActions.findAllSuccess, (state, action) => {
    return {
      ...state,
      captionsList: action.captionListEntity.captions.map((item) => ({
        ...item,
        history: [],
      })),
      loading: false,
    };
  })
);
