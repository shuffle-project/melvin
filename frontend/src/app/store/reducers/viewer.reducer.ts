import { createReducer, on } from '@ngrx/store';
import { ProjectEntity } from '../../services/api/entities/project.entity';
import { StorageService } from '../../services/storage/storage.service';
import * as viewerActions from '../actions/viewer.actions';

const storage = new StorageService();

export interface ViewerState {
  projectLoading: boolean;
  project: ProjectEntity | null;

  // settings
  // volume: number;
}

export const initalState: ViewerState = {
  projectLoading: false,
  project: null,
  // volume: storage.getFromSessionStorage(StorageKey.MEDIA_VOLUME, 1) as number,
};

export const viewerReducer = createReducer(
  initalState,
  on(viewerActions.findProject, (state) => {
    return {
      ...state,
      project: null,
      projectLoading: true,
    };
  }),

  on(viewerActions.findProjectSuccess, (state, { project }) => {
    return {
      ...state,
      project: { ...project },
      projectLoading: false,
    };
  })
);
