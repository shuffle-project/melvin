import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ViewerState } from '../reducers/viewer.reducer';

export const selectViewerState = createFeatureSelector<ViewerState>('viewer');

export const selectProject = createSelector(
  selectViewerState,
  (state: ViewerState) => {
    return state.project;
  }
);
