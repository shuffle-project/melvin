import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  EDITOR_USER_LOADING,
  EditorUserColor,
} from '../../constants/editor.constants';
import { EditorUser } from '../../interfaces/editor-user.interface';
import { ProjectStatus } from '../../services/api/entities/project.entity';
import { EditorState } from '../reducers/editor.reducer';
import * as authSelectors from '../selectors/auth.selector';

export const selectEditorState = createFeatureSelector<EditorState>('editor');

export const editorState = createSelector(
  selectEditorState,
  (state: EditorState) => state
);

export const selectIsPlaying = createSelector(
  selectEditorState,
  (state: EditorState) => state.isPlaying
);

export const selectIsLiveMode = createSelector(
  selectEditorState,
  (state: EditorState) => {
    return (
      state.project && [ProjectStatus.LIVE].includes(state.project?.status)
    );
  }
);

export const selectIsLiveInSync = createSelector(
  selectEditorState,
  (state: EditorState) => state.isLiveInSync
);

export const selectCurrentSpeed = createSelector(
  selectEditorState,
  (state: EditorState) => state.currentSpeed
);

export const selectVolume = createSelector(
  selectEditorState,
  (state: EditorState) => state.volume
);

export const selectDuration = createSelector(
  selectEditorState,
  (state: EditorState) => state.project?.duration || 0
);

export const selectSubtitlesEnabledInVideo = createSelector(
  selectEditorState,
  (state: EditorState) => state.subtitlesEnabledInVideo
);

export const selectProject = createSelector(
  selectEditorState,
  (state: EditorState) => {
    return state.project;
  }
);

export const selectMedia = createSelector(
  selectEditorState,
  (state: EditorState) => {
    return state.media;
  }
);

export const selectActiveUsers = createSelector(
  selectEditorState,
  authSelectors.selectUserId,
  (state: EditorState, authUserId: string | null): EditorUser[] => {
    const activeUsers = state.activeUsers;

    // if project is not yet loaded, show a "Load..."- placeholder instead
    if (!state.project?.users) {
      return [EDITOR_USER_LOADING];
    }

    const editorUsers: EditorUser[] = activeUsers.map((activeUser) => {
      const userEntity = state.project?.users.find(
        (user) => user.id === activeUser.id
      );

      // if project is not yet loaded, show a "Load..."- placeholder instead
      return userEntity
        ? {
            ...userEntity,
            color:
              authUserId === activeUser.id
                ? EditorUserColor.PRIMARY
                : activeUser.color,
          }
        : EDITOR_USER_LOADING;
    });

    return editorUsers.sort((a, b) =>
      a.id === authUserId ? -1 : b.id === authUserId ? 1 : 0
    );
  }
);

export const selectWaveform = createSelector(
  selectEditorState,
  (state: EditorState) => state.waveform
);

export const selectCaptionTextValidationEnabled = createSelector(
  selectEditorState,
  (state: EditorState) => state.isCaptionTextValidationEnabled
);
