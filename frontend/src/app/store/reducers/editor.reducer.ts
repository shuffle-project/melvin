import { createReducer, on } from '@ngrx/store';
import { EditorUserColor } from 'src/app/interfaces/editor-user.interface';
import {
  ProjectEntity,
  ProjectMediaEntity,
} from '../../services/api/entities/project.entity';
import { StorageKey } from '../../services/storage/storage-key.enum';
import { StorageService } from '../../services/storage/storage.service';
import * as editorActions from '../actions/editor.actions';
import * as projectsActions from '../actions/projects.actions';
import * as userTestActions from '../actions/user-test.actions';

const storage = new StorageService();

export interface EditorUser {
  userId: string;
  clientId: string;
  active: boolean;
  color: EditorUserColor;
}

export interface EditorState {
  projectLoading: boolean;
  project: ProjectEntity | null;
  media: ProjectMediaEntity | null;

  isPlaying: boolean;
  isLiveInSync: boolean;
  currentSpeed: number;
  editorUsers: EditorUser[];
  volume: number;
  subtitlesEnabledInVideo: boolean;
  waveform: number[];
  isCaptionTextValidationEnabled: boolean;

  spellchecking: boolean;
  showUsernames: boolean;
  muted: boolean;
}

export const initalState: EditorState = {
  projectLoading: false,
  project: null,
  media: null,
  isPlaying: false,
  isLiveInSync: false,
  currentSpeed: 1,
  editorUsers: [],
  volume: storage.getFromSessionStorage(StorageKey.MEDIA_VOLUME, 1) as number,
  subtitlesEnabledInVideo: storage.getFromLocalStorage(
    StorageKey.MEDIA_SUBTITLES_ENABLED,
    false
  ) as boolean,
  waveform: [],
  isCaptionTextValidationEnabled: storage.getFromLocalStorage(
    StorageKey.CAPTION_TEXT_VALIDATION_ENABLED,
    false
  ) as boolean,

  spellchecking: storage.getFromLocalStorage(
    StorageKey.EDITOR_SPELLCHECKING,
    true
  ) as boolean,
  showUsernames: storage.getFromLocalStorage(
    StorageKey.EDITOR_SHOW_USERNAMES,
    true
  ) as boolean,
  muted: storage.getFromSessionStorage(
    StorageKey.EDITOR_MEDIA_MUTED,
    false
  ) as boolean,
};

export const editorReducer = createReducer(
  initalState,
  on(editorActions.resetEditorState, (state) => ({
    ...state,
    ...initalState,
  })),
  // Play
  on(
    editorActions.playFromCaption,
    editorActions.playFromMediaService,
    (state) => ({
      ...state,
      isPlaying: true,
    })
  ),

  // Pause
  on(
    editorActions.pauseFromVideoComponent,
    userTestActions.stopFromWS,
    (state) => ({
      ...state,
      isPlaying: false,
    })
  ),

  // Toggle Play/Pause
  on(
    editorActions.togglePlayPauseFromEditor,
    editorActions.togglePlayPauseFromVideo,
    (state) => ({
      ...state,
      isPlaying: !state.isPlaying,
      isLiveInSync: false,
    })
  ),

  on(editorActions.backToLive, (state) => ({
    ...state,
    isPlaying: true,
    isLiveInSync: true,
    currentSpeed: 1,
  })),
  on(editorActions.changeSpeedFromEditor, (state, action) => ({
    ...state,
    currentSpeed: action.speed,
  })),
  on(editorActions.changeVolumeFromVideoComponent, (state, action) => ({
    ...state,
    volume: action.volume,
  })),
  on(editorActions.toggleMutedFromEditor, (state) => ({
    ...state,
    muted: !state.muted,
  })),
  on(editorActions.toggleSubtitlesFromEditor, (state) => ({
    ...state,
    subtitlesEnabledInVideo: !state.subtitlesEnabledInVideo,
  })),
  on(editorActions.updateActiveUsers, (state, action) => {
    return {
      ...state,
      editorUsers: [...action.users],
    };
  }),
  on(editorActions.findProjectFromEditor, (state) => {
    return {
      ...state,
      projectLoading: true,
    };
  }),

  on(
    editorActions.findProjectSuccess,
    projectsActions.findOneSuccess,
    (state, { project }) => {
      return {
        ...state,
        project: { ...project },
        projectLoading: false,
      };
    }
  ),

  on(
    projectsActions.updateSuccess,
    projectsActions.updateFromWS,
    (state, { updatedProject }) => {
      return {
        ...state,
        ...(updatedProject.id === state.project?.id
          ? { project: updatedProject }
          : {}),
      };
    }
  ),

  on(projectsActions.updateFromWSPartial, (state, { updatedProject }) => {
    return {
      ...state,
      ...(updatedProject.id === state.project?.id
        ? {
            project: {
              ...state.project,
              ...updatedProject,
              livestream: {
                // dont overwrite nested
                ...state.project?.livestream,
                ...updatedProject.livestream,
              },
            } as ProjectEntity,
          }
        : {}),
    };
  }),

  // project media

  on(
    editorActions.findProjectMediaSuccess,
    editorActions.deleteProjectMediaSuccess,
    (state, { media }) => {
      return { ...state, media };
    }
  ),

  // waveform

  on(editorActions.getWaveformSuccess, (state, { values }) => {
    return {
      ...state,
      waveform: values,
    };
  }),

  on(editorActions.updateWaveformFromWS, (state, { projectId, values }) => {
    return {
      ...state,
      waveform: [...state.waveform, ...values],
    };
  }),

  on(editorActions.setCaptionTextValidationEnabled, (state, { enabled }) => {
    return {
      ...state,
      isCaptionTextValidationEnabled: enabled,
    };
  }),
  on(editorActions.changeSpellchecking, (state, { spellchecking }) => {
    return {
      ...state,
      spellchecking,
    };
  }),
  on(editorActions.toggleShowUsernames, (state) => {
    return {
      ...state,
      showUsernames: !state.showUsernames,
    };
  }),

  // User-Test
  on(userTestActions.resumeFromUserTestEffect, (state) => {
    return {
      ...state,
      isPlaying: true,
    };
  })
);
